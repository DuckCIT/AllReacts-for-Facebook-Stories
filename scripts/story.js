var EMOJI_LIST = null; // Giữ emoji trong bộ nhớ
var FB_CLASSES = null; // Giữ các class name của Facebook trong bộ nhớ
var toasts = []; // Mảng lưu trữ tất cả các toast đang hiển thị
var storyState = false; // Biến trạng thái story (đang dừng hay không)

// Tải các class name của Facebook
async function loadFacebookClasses() {
    if (FB_CLASSES) {
        return FB_CLASSES; // Trả về class đã được lưu
    }
    try {
        // Thử tải từ GitHub
        const githubUrl = 'https://raw.githubusercontent.com/DuckCIT/AllReacts-for-Facebook-Stories/main/data/facebook.json';
        let response = await fetch(githubUrl);
        if (!response.ok) throw new Error(`Failed to fetch classes from GitHub: ${response.status}`);
        FB_CLASSES = await response.json();
        return FB_CLASSES;
    } catch (e) {
        // Fallback về file cục bộ
        try {
            const localUrl = extension.runtime.getURL('data/facebook.json');
            const response = await fetch(localUrl);
            if (!response.ok) throw new Error(`Failed to fetch local classes: ${response.status}`);
            FB_CLASSES = await response.json();
            showToast("Loading class from GitHub failed, using local file.");
            return FB_CLASSES;
        } catch (localError) {
            console.error('Error loading local facebook.json:', localError);
            showToast("Unable to load Facebook classes.");
            return null;
        }
    }
}

// Tải danh sách emoji
async function loadEmojis() {
    if (EMOJI_LIST) {
        loadModal(EMOJI_LIST); // Nếu đã tải trước đó, không cần fetch lại
        return;
    }
    try {
        // Thử tải từ GitHub
        const githubUrl = 'https://raw.githubusercontent.com/DuckCIT/AllReacts-for-Facebook-Stories/main/data/emojis.json';
        let response = await fetch(githubUrl);
        if (!response.ok) throw new Error(`Failed to fetch emoji from GitHub: ${response.status}`);
        EMOJI_LIST = await response.json();
        await loadFacebookClasses(); // Đảm bảo class được tải
        loadModal(EMOJI_LIST);
    } catch (e) {
        // Fallback về file cục bộ
        try {
            const localUrl = extension.runtime.getURL('data/emojis.json');
            const response = await fetch(localUrl);
            if (!response.ok) throw new Error(`Failed to fetch local emoji: ${response.status}`);
            EMOJI_LIST = await response.json();
            showToast("Loading from GitHub failed, using local file.");
            await loadFacebookClasses();
            loadModal(EMOJI_LIST);
        } catch (localError) {
            console.error('Error loading local emojis.json:', localError);
            showToast("Unable to load emoji.");
        }
    }
}

(async () => {
    if (document.getElementsByClassName('btn-react').length > 0) return;
    loadEmojis(); // Chỉ tải lại emoji khi cần
})();

function getEmojiName(emoji) {
    // Nếu có trường name, sử dụng trực tiếp
    if (emoji.name) {
        return emoji.name;
    }
    // Fallback: Tách tên từ URL
    const parts = emoji.url.split('/');
    const fileName = parts[parts.length - 1];
    const emojiName = fileName.split('_')[0].replace(/-/g, ' ');
    return emojiName;
}

// Check for updates and add badge to button if available
function checkUpdate(btnReact) {
    const versionURL = 'https://raw.githubusercontent.com/DuckCIT/AllReacts-for-Facebook-Stories/main/data/version.json';
    const currentVersion = extension.runtime.getManifest().version;
    
    fetch(versionURL)
        .then(response => response.json())
        .then(data => {
            if (data.version > currentVersion) {
                // Add update badge to button
                const badge = document.createElement('div');
                badge.setAttribute('class', 'update-badge');
                badge.title = `Update available: v${data.version}`;
                btnReact.appendChild(badge);
                btnReact.style.position = 'relative';
            }
        })
        .catch(error => {
            console.log('Update check failed:', error);
        });
}

function loadModal(EMOJI_DATA) {
    if (!FB_CLASSES) return; // Đảm bảo class đã được tải
    // Lấy fb_dtsg và user_id
    const fb_dtsg = getFbdtsg();
    const user_id = getUserId();
    
    // Xử lý cấu trúc mới của emoji data
    const categories = getCategoriesFromData(EMOJI_DATA);
    const allEmojis = getAllEmojisFromData(EMOJI_DATA);
    
    // Tạo nút react
    const btnReact = document.createElement('div');
    btnReact.setAttribute('class', 'btn-react');
    btnReact.innerHTML = `
    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="4" x2="12" y2="20" stroke="white" stroke-width="3" stroke-linecap="round"></line>
        <line x1="4" y1="12" x2="20" y2="12" stroke="white" stroke-width="3" stroke-linecap="round"></line>
    </svg>
    `;
    
    // Check for updates and show badge if available
    checkUpdate(btnReact);
    
    // Tạo nhóm emoji
    const emojiGroup = document.createElement('ul');
    emojiGroup.setAttribute('class', 'emoji-group');
    // Tạo container menu
    const menuContainer = document.createElement('div');
    menuContainer.setAttribute('class', 'menu-container');
    // Biến timeout để xử lý sự kiện mouseover/mouseout
    let timeout;
    // Xử lý khi chuột di vào nút react
    btnReact.addEventListener('mouseover', () => {
        btnReact.style.scale = '1.2';
        btnReact.style.border = '1.5px solid white';
        menuContainer.classList.add('show');
        rotateIcon(45);
        clearTimeout(timeout);
    });
    // Xử lý khi chuột rời khỏi nút react
    btnReact.addEventListener('mouseout', () => {
        timeout = setTimeout(() => {
            if (!menuContainer.matches(':hover')) {
                menuContainer.classList.remove('show');
            }
            rotateIcon(0);
            btnReact.style.border = '1.5px solid #474747';
        }, 500);
        btnReact.style.scale = '1';
    });
    // Xử lý khi chuột di vào menu
    menuContainer.addEventListener('mouseover', () => {
        clearTimeout(timeout);
    });
    // Xử lý khi chuột rời khỏi menu
    menuContainer.addEventListener('mouseout', () => {
        timeout = setTimeout(() => {
            menuContainer.classList.remove('show');
            btnReact.style.border = '1.5px solid #474747';
            rotateIcon(0);
        }, 500);
        btnReact.style.scale = '1';
    });
    // Hàm quay biểu tượng khi hover
    function rotateIcon(degrees) {
        const icon = btnReact.querySelector('.icon');
        icon.style.transition = 'transform 0.5s';
        icon.style.transform = `rotate(${degrees}deg)`;
    }
    
    // Mapping category IDs and labels
    const categoryNames = ['Recent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'];
    const categoryLabels = ['Recent', 'Smileys & People', 'Animals & Nature', 'Food & Drink', 'Activity', 'Travel & Places', 'Objects', 'Symbols', 'Flags'];
    
    // SVG icons cho từng category
    const categoryIconsSVG = {
        'Recent': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>',
        'people': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/></svg>',
        'nature': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="4.5" cy="9.5" r="2.5"/><circle cx="9" cy="5.5" r="2.5"/><circle cx="15" cy="5.5" r="2.5"/><circle cx="19.5" cy="9.5" r="2.5"/><path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8z"/></svg>',
        'foods': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>',
        'activity': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9l5.31 5.31c.31.31.85.09.85-.36V6c0-.28.22-.5.5-.5s.5.22.5.5v8c0 .28.22.5.5.5s.5-.22.5-.5v-4c0-.28.22-.5.5-.5s.5.22.5.5v4c0 .28.22.5.5.5s.5-.22.5-.5v-2c0-.28.22-.5.5-.5s.5.22.5.5v6.48c0 .31.13.61.36.83l1.31 1.31C16.55 19.37 14.85 20 13 20h-1z"/></svg>',
        'places': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.56 3.91c.59.59.59 1.54 0 2.12l-3.89 3.89 2.12 9.19-1.41 1.42-3.88-7.43L9.6 17l.36 2.47-1.07 1.06-1.76-3.18-3.19-1.77L5 14.5l2.5.37 3.88-3.89-7.42-3.88 1.41-1.41 9.19 2.12 3.89-3.89c.56-.58 1.56-.58 2.11 0z"/></svg>',
        'objects': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
        'symbols': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        'flags': '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>'
    };
    
    // Tạo search container với icon
    const searchContainer = document.createElement('div');
    searchContainer.style.position = 'relative';
    searchContainer.style.width = '100%';
    
    const searchIcon = document.createElement('div');
    searchIcon.setAttribute('class', 'emoji-search-icon');
    searchIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
    
    const searchBox = document.createElement('input');
    searchBox.setAttribute('type', 'text');
    searchBox.setAttribute('class', 'emoji-search');
    searchBox.setAttribute('placeholder', 'Search emoji');
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchBox);
    
    // Render tất cả emoji với category headers
    const renderAllEmojis = () => {
        emojiGroup.innerHTML = '';
        
        categoryNames.forEach((catName, index) => {
            const emojisInCategory = categories[catName] || [];
            
            // Tạo category header (luôn hiển thị dù chưa có emoji)
            const categoryHeader = document.createElement('div');
            categoryHeader.setAttribute('class', 'emoji-category-header');
            categoryHeader.setAttribute('data-category', catName);
            categoryHeader.textContent = categoryLabels[index];
            emojiGroup.appendChild(categoryHeader);
            
            // Thêm emojis của category này (nếu có)
            if (emojisInCategory.length > 0) {
                groupEmoji(fb_dtsg, user_id, emojiGroup, emojisInCategory);
            } else if (catName === 'Recent') {
                // Hiển thị thông báo khi chưa có emoji gần đây
                const emptyRecent = document.createElement('div');
                emptyRecent.setAttribute('class', 'empty-recent');
                emptyRecent.innerHTML = `
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="#666">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                    </svg>
                    <p>No emoji used yet</p>
                    <span>Emoji you use will appear here</span>
                `;
                emojiGroup.appendChild(emptyRecent);
            }
        });
    };
    
    // Search functionality với debounce
    let isSearching = false;
    let searchTimeout = null;
    
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Clear timeout cũ nếu có
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Nếu không có từ khóa, render lại ngay
        if (!searchTerm) {
            isSearching = false;
            renderAllEmojis();
            return;
        }
        
        // Debounce: chờ 300ms sau khi ngừng gõ mới search
        searchTimeout = setTimeout(() => {
            isSearching = true;
            emojiGroup.innerHTML = '';
            
            const searchHeader = document.createElement('div');
            searchHeader.setAttribute('class', 'emoji-category-header');
            searchHeader.textContent = 'Search Results';
            emojiGroup.appendChild(searchHeader);
            
            const searchResults = allEmojis.filter(emoji => {
                const emojiName = getEmojiName(emoji).toLowerCase();
                return emojiName.includes(searchTerm) || emoji.value.includes(searchTerm);
            });
            
            if (searchResults.length > 0) {
                // Giới hạn kết quả để tránh lag
                const limitedResults = searchResults.slice(0, 100);
                groupEmoji(fb_dtsg, user_id, emojiGroup, limitedResults);
                
                if (searchResults.length > 100) {
                    const moreInfo = document.createElement('div');
                    moreInfo.style.cssText = 'text-align: center; padding: 10px; color: #999; grid-column: 1 / -1; font-size: 12px;';
                    moreInfo.textContent = `Showing 100/${searchResults.length} results. Try a more specific search.`;
                    emojiGroup.appendChild(moreInfo);
                }
            } else {
                emojiGroup.innerHTML += '<div style="text-align: center; padding: 20px; color: #999; grid-column: 1 / -1;">No results found</div>';
            }
        }, 300);
    });
    
    // Tạo category tabs
    const categoryTabs = document.createElement('div');
    categoryTabs.setAttribute('class', 'emoji-category-tabs');
    
    categoryNames.forEach((catName, index) => {
        const tab = document.createElement('button');
        tab.setAttribute('class', 'emoji-category-tab' + (index === 0 ? ' active' : ''));
        tab.setAttribute('data-category', catName);
        tab.innerHTML = categoryIconsSVG[catName];
        tab.title = categoryLabels[index];
        
        tab.addEventListener('click', () => {
            if (isSearching) {
                searchBox.value = '';
                isSearching = false;
                renderAllEmojis();
            }
            
            // Update active tab
            categoryTabs.querySelectorAll('.emoji-category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Scroll to category
            const categoryHeader = emojiGroup.querySelector(`[data-category="${catName}"]`);
            if (categoryHeader) {
                categoryHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        categoryTabs.appendChild(tab);
    });
    
    // Initial render - hiển thị tất cả
    renderAllEmojis();
    
    // Scroll listener để update active tab
    emojiGroup.addEventListener('scroll', () => {
        if (isSearching) return;
        
        const headers = emojiGroup.querySelectorAll('.emoji-category-header');
        const scrollTop = emojiGroup.scrollTop;
        
        headers.forEach((header, index) => {
            const headerTop = header.offsetTop - emojiGroup.offsetTop;
            const nextHeader = headers[index + 1];
            const nextHeaderTop = nextHeader ? nextHeader.offsetTop - emojiGroup.offsetTop : emojiGroup.scrollHeight;
            
            if (scrollTop >= headerTop - 10 && scrollTop < nextHeaderTop - 10) {
                const catName = header.getAttribute('data-category');
                categoryTabs.querySelectorAll('.emoji-category-tab').forEach(t => t.classList.remove('active'));
                const activeTab = categoryTabs.querySelector(`[data-category="${catName}"]`);
                if (activeTab) activeTab.classList.add('active');
            }
        });
    });
    
    // Thêm các phần tử vào menu container theo thứ tự: search, emojiGroup, tabs
    menuContainer.appendChild(searchContainer);
    menuContainer.appendChild(emojiGroup);
    menuContainer.appendChild(categoryTabs);
    // Tạo phần "More Reactions"
    const moreReactions = document.createElement('div');
    moreReactions.setAttribute('class', 'more-reactions');
    moreReactions.appendChild(btnReact);
    moreReactions.appendChild(menuContainer);
    // Kiểm tra và tạo nút react, tạo menu
    
    const injectInitialMoreReactions = () => {
        const storiesFooter = document.querySelector(`.${FB_CLASSES.storiesFooter.split(' ').join('.')}`);
        if (!storiesFooter) return false;
        const defaultReactions = Array.from(storiesFooter.querySelectorAll(`.${FB_CLASSES.defaultReactions.split(' ').join('.')}`))
            .find(el => el.offsetWidth === 336);
        const container = defaultReactions.parentElement;
        if (container) {
            container.style.display = 'flex';
            container.style.flexWrap = 'nowrap';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
        }
        if (!defaultReactions) return false;
        if (!storiesFooter.querySelector('.more-reactions')) {
            defaultReactions.insertAdjacentElement('afterend', moreReactions);
            return true;
        }
        return false;
    };
    const timeoutCheckStoriesFooter = setInterval(() => {
        if (injectInitialMoreReactions()) {
            clearInterval(timeoutCheckStoriesFooter);
        }
    }, 100);
}

(function () {
    'use strict';
    let isMoreReactionsAdded = false;
    // Hàm kiểm tra và chèn/sửa vị trí "More Reactions"
    function injectMoreReactions(moreReactions) {
        const storiesFooter = document.querySelector(`.${FB_CLASSES.storiesFooter.split(' ').join('.')}`);
        if (!storiesFooter) return false;
        const defaultReactions = Array.from(storiesFooter.querySelectorAll(`.${FB_CLASSES.defaultReactions.split(' ').join('.')}`))
            .find(el => el.offsetWidth === 336);
        const container = defaultReactions.parentElement;
        if (container) {
            container.style.display = 'flex';
            container.style.flexWrap = 'nowrap';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
        }
        if (!defaultReactions) {
            // Nếu reactions mặc định không tồn tại, xóa "More Reactions"
            if (moreReactions.parentElement) {
                moreReactions.parentElement.removeChild(moreReactions);
                isMoreReactionsAdded = false;
            }
            return false;
        }
        const currentMoreReactions = storiesFooter.querySelector('.more-reactions');
        if (currentMoreReactions) {
            // Nếu "More Reactions" đã tồn tại nhưng sai vị trí, di chuyển nó
            if (currentMoreReactions.previousElementSibling !== defaultReactions) {
                defaultReactions.insertAdjacentElement('afterend', currentMoreReactions);
            }
            isMoreReactionsAdded = true;
        } else {
            // Nếu chưa có, chèn mới
            defaultReactions.insertAdjacentElement('afterend', moreReactions);
            isMoreReactionsAdded = true;
        }
        return true;
    }
    // Hàm thiết lập theo dõi DOM
    function setupContentEditableTracking() {
        const moreReactions = document.querySelector('.more-reactions');
        if (!moreReactions) return;
        // Theo dõi DOM liên tục
        const observer = new MutationObserver(() => {
            injectMoreReactions(moreReactions);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    // Gọi hàm khi trang tải
    window.addEventListener('load', setupContentEditableTracking);
    // Theo dõi thay đổi DOM để chạy lại nếu "More Reactions" bị xóa
    const observer = new MutationObserver(() => {
        if (!document.querySelector('.more-reactions')) {
            isMoreReactionsAdded = false;
        }
        setupContentEditableTracking();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();

// Hàm tìm nút phát/tạm dừng story
function getButton() {
    const buttons = document.querySelectorAll('[role="button"]');
    // Lọc tất cả nút có chứa div class cụ thể
    const matched = Array.from(buttons).filter(button =>
        button.querySelector(`div.${FB_CLASSES.buttonDiv.split(' ').join('.')}`)
    );
    // Trả về nút thứ 2 (index 1), nếu có
    return matched[1] || null;
}

// Hàm lấy categories từ data mới
function getCategoriesFromData(emojiData) {
    const categories = {
        'Recent': []
    };
    
    // Lấy lịch sử emoji và sắp xếp theo thứ tự sử dụng gần nhất
    const emojiHistory = JSON.parse(localStorage.getItem('emojiHistory')) || [];
    const allEmojis = getAllEmojisFromData(emojiData);
    
    // Map theo thứ tự trong history (gần nhất trước)
    categories['Recent'] = emojiHistory
        .map(h => allEmojis.find(emoji => emoji.value === h.value) || h)
        .filter(emoji => emoji && emoji.url)
        .slice(0, 30);
    
    // Nếu data có cấu trúc categories mới
    if (emojiData.categories && Array.isArray(emojiData.categories)) {
        emojiData.categories.forEach(cat => {
            categories[cat.id] = cat.emojis || [];
        });
    } else if (Array.isArray(emojiData)) {
        // Fallback cho cấu trúc cũ (mảng emoji đơn giản)
        categories['people'] = emojiData;
    }
    
    return categories;
}

// Hàm lấy tất cả emoji từ data (để search)
function getAllEmojisFromData(emojiData) {
    let allEmojis = [];
    
    if (emojiData.categories && Array.isArray(emojiData.categories)) {
        emojiData.categories.forEach(cat => {
            if (cat.emojis && Array.isArray(cat.emojis)) {
                allEmojis = allEmojis.concat(cat.emojis);
            }
        });
    } else if (Array.isArray(emojiData)) {
        allEmojis = emojiData;
    }
    
    return allEmojis;
}

// Hàm thêm emoji vào nhóm emoji
function groupEmoji(fb_dtsg, user_id, emojiGroup, emojiList) {
    let tooltipTimeout;
    const svgPath = FB_CLASSES.svgPath;
    // Tạo Intersection Observer để lazy load hình ảnh
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const emojiLi = entry.target;
                const emojiImage = emojiLi.querySelector('.emoji-image');
                /* const emojiImageAnim = emojiLi.querySelector('.emoji-image-anim'); */
                if (emojiImage && emojiImage.dataset.src) {
                    emojiImage.src = emojiImage.dataset.src;
                    emojiImage.removeAttribute('data-src');
                }
                /* if (emojiImageAnim && emojiImageAnim.dataset.src) {
                    emojiImageAnim.src = emojiImageAnim.dataset.src;
                    emojiImageAnim.removeAttribute('data-src');
                } */
                emojiLi.classList.add('emoji-appear');
                observer.unobserve(emojiLi);
            }
        });
    }, {
        rootMargin: "0px 0px 100px 0px"
    });
    // Lặp qua từng emoji trong danh sách
    emojiList.forEach(emoji => {
        const emojiLi = document.createElement('li');
        emojiLi.setAttribute('class', 'emoji');
        emojiLi.setAttribute('value', emoji.value);
        const emojiImage = document.createElement('img');
        emojiImage.setAttribute('class', 'emoji-image');
        emojiImage.setAttribute('data-src', emoji.url);
        emojiLi.appendChild(emojiImage);
        /* const emojiImageAnim = document.createElement('img');
        emojiImageAnim.setAttribute('class', 'emoji-image-anim');
        emojiImageAnim.setAttribute('data-src', emoji.image_anim_url);
        emojiLi.appendChild(emojiImageAnim); */
        observer.observe(emojiLi);
        const tooltip = document.createElement('div');
        tooltip.classList.add('info-emoji');
        tooltip.textContent = getEmojiName(emoji);
        // Sự kiện khi chuột vào emoji
        emojiLi.addEventListener('mouseenter', () => {
            const stopButton = getButton();
            if (stopButton) {
                const svgCheck = document.querySelector(svgPath);
                if (!svgCheck && !storyState) {
                    stopButton.click();
                    storyState = true;
                }
            }
            // Reset và chạy lại animation của emoji-image-anim
            /* emojiImageAnim.src = ''; // Xóa src để reset GIF
            emojiImageAnim.src = emoji.image_anim_url; // Tải lại để chạy từ đầu */
            tooltipTimeout = setTimeout(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            }, 500);
            document.body.appendChild(tooltip);
            const rect = emojiLi.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const leftPosition = rect.left + window.pageXOffset + (rect.width / 2) - (tooltipRect.width / 2);
            const topPosition = rect.bottom + window.pageYOffset + 5;
            tooltip.style.left = `${leftPosition}px`;
            tooltip.style.top = `${topPosition}px`;
            const rightEdge = leftPosition + tooltipRect.width;
            const bottomEdge = topPosition + tooltipRect.height;
            if (rightEdge > window.innerWidth) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
            }
            if (bottomEdge > window.innerHeight) {
                tooltip.style.top = `${rect.top + window.pageYOffset - tooltipRect.height - 5}px`;
            }
            const menuRect = emojiGroup.getBoundingClientRect();
            if (bottomEdge > menuRect.bottom) {
                tooltip.style.top = `${rect.top + window.pageYOffset - tooltipRect.height - 5}px`;
            } else if (topPosition < menuRect.top) {
                tooltip.style.top = `${rect.bottom + window.pageYOffset + 5}px`;
            }
        });
        // Sự kiện khi chuột rời khỏi emoji
        emojiLi.addEventListener('mouseleave', () => {
            // Reset animation về trạng thái đầu tiên
            /* emojiImageAnim.src = ''; // Xóa src để dừng GIF
            emojiImageAnim.src = emoji.image_anim_url; // Tải lại để reset về khung đầu */
            clearTimeout(tooltipTimeout);
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (tooltip.parentElement) {
                    tooltip.parentElement.removeChild(tooltip);
                }
            }, 200);
        });
        // Sự kiện khi người dùng click vào emoji
        emojiLi.onclick = async function () {
            emojiLi.style.backgroundColor = 'rgba(165, 165, 165, 0.9)';
            emojiLi.style.borderRadius = '5px';
            emojiImage.style.transform = 'scale(1.2)';
            setTimeout(() => {
                emojiLi.style.backgroundColor = '';
                emojiImage.style.transform = 'scale(1)';
            }, 200);
            const storyId = getStoryId();
            try {
                saveEmojiToHistory(emoji.value, emoji.url, emoji.name);
                await reactStory(user_id, fb_dtsg, storyId, emoji.value);
            } catch (e) {
                console.error(e);
            }
        };
        emojiGroup.appendChild(emojiLi);
        emojiGroup.addEventListener('mouseleave', () => {
            const playButton = getButton();
            if (playButton && storyState) {
                const svgCheck = document.querySelector(svgPath);
                if (svgCheck) {
                    playButton.click();
                }
            }
            storyState = false;
        });
    });
}

function saveEmojiToHistory(emojiValue, emojiImageUrl, emojiName = null) {
    // Lấy lịch sử emoji từ localStorage (nếu không có thì khởi tạo mảng rỗng)
    let emojiHistory = JSON.parse(localStorage.getItem('emojiHistory')) || [];
    // Tạo đối tượng emoji mới (bao gồm cả name nếu có)
    const emoji = { value: emojiValue, url: emojiImageUrl };
    if (emojiName) {
        emoji.name = emojiName;
    }
    // Kiểm tra xem emoji đã tồn tại trong lịch sử hay chưa
    const emojiIndex = emojiHistory.findIndex(item => item.value === emojiValue);
    // Nếu emoji đã có trong lịch sử, xóa nó khỏi mảng
    if (emojiIndex !== -1) {
        emojiHistory.splice(emojiIndex, 1);
    }
    // Thêm emoji mới vào đầu mảng
    emojiHistory.unshift(emoji);
    // Giới hạn tối đa 30 emoji gần đây
    if (emojiHistory.length > 30) {
        emojiHistory.pop();
    }
    // Lưu lại lịch sử emoji vào localStorage
    localStorage.setItem('emojiHistory', JSON.stringify(emojiHistory));
}

/**
 * Hiển thị một thông báo toast trên màn hình
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo ('loading' | 'success' | 'error')
 * @returns {HTMLElement} - Trả về phần tử toast vừa tạo
 */
function showToast(message, type = 'info') {
    // Tạo phần tử div cho toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    // Nếu là loading, lưu ID để cập nhật sau này
    if (type === 'loading') {
        toast.dataset.loadingId = `loading-${Date.now()}`;
    }
    // Nếu không phải loading, thêm progress bar
    if (type !== 'loading') {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        toast.appendChild(progressBar);
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 100);
    }
    // Thêm toast vào body
    document.body.appendChild(toast);
    toasts.push(toast);
    updateToastPositions();
    // Nếu không phải loading, tự động xóa sau 3 giây
    if (type !== 'loading') {
        setTimeout(() => removeToast(toast), 3000);
    }
    return toast;
}

/**
 * Cập nhật vị trí của các toast để chúng xếp chồng lên nhau
 */
function updateToastPositions() {
    toasts.forEach((toast, index) => {
        toast.style.bottom = `${20 + index * 50}px`;
    });
}

/**
 * Xóa một toast khỏi giao diện và mảng
 * @param {HTMLElement} toast - Phần tử toast cần xóa
 */
function removeToast(toast) {
    toast.style.opacity = '0';
    setTimeout(() => {
        toast.remove();
        toasts = toasts.filter(t => t !== toast);
        updateToastPositions();
    }, 500);
}

/**
 * Cập nhật một toast loading thành success hoặc error
 * @param {string} loadingId - ID của toast loading cần thay thế
 * @param {string} newMessage - Thông báo mới
 * @param {string} newType - Loại mới ('success' hoặc 'error')
 */
function updateToast(loadingId, newMessage, newType) {
    const loadingToast = toasts.find(toast => toast.dataset.loadingId === loadingId);
    if (loadingToast) {
        loadingToast.textContent = newMessage;
        loadingToast.className = `toast ${newType}`;
        delete loadingToast.dataset.loadingId;
        // Thêm progress bar nếu là success/error
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        loadingToast.appendChild(progressBar);
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 100);
        // Xóa toast sau 3 giây
        setTimeout(() => removeToast(loadingToast), 3000);
    }
}

/**
 * Lấy ID của story hiện tại
 * @returns {string} - ID của story
 */
function getStoryId() {
    const htmlStory = document.getElementsByClassName(FB_CLASSES.htmlStory);
    return htmlStory[htmlStory.length - 1].getAttribute('data-id');
}

/**
 * Lấy mã xác thực fb_dtsg từ HTML
 * @returns {string} - Mã fb_dtsg nếu tìm thấy, ngược lại là chuỗi rỗng
 */
function getFbdtsg() {
    const regex = /"DTSGInitialData",\[],{"token":"(.+?)"/gm;
    const resp = regex.exec(document.documentElement.innerHTML);
    return resp ? resp[1] : '';
}

function getLsd() {
    const html = document.documentElement.innerHTML;
    let match = /name=\"lsd\" value=\"([^\"]+)\"/m.exec(html);
    if (match) return match[1];
    match = /\["LSD",\[],\{"token":"(.+?)"\}\]/m.exec(html);
    return match ? match[1] : '';
}

function getXFbLsd() {
    const html = document.documentElement.innerHTML;
    let match = /"token"\s*:\s*"([A-Za-z0-9\-_]+)"\s*,\s*"name"\s*:\s*"x-fb-lsd"/m.exec(html);
    if (match) return match[1];
    match = /\["X_FB_LSD",\[],\{"token":"(.+?)"\}\]/m.exec(html);
    return match ? match[1] : '';
}

function getAsbdId() {
    const html = document.documentElement.innerHTML;
    const match = /"ASBD_ID"\s*:\s*"?(\d+)"?/m.exec(html);
    return match ? match[1] : '';
}

function getJazoest(fb_dtsg) {
    if (!fb_dtsg) return '';
    let sum = 0;
    for (let i = 0; i < fb_dtsg.length; i++) sum += fb_dtsg.charCodeAt(i);
    return '2' + sum;
}

function getSpinR() {
    const html = document.documentElement.innerHTML;
    let match = /"__spin_r":(\d+)/m.exec(html);
    if (match) return match[1];
    match = /__spin_r\s*\n\s*(\d+)/m.exec(html);
    return match ? match[1] : '';
}

function getSpinB() {
    const html = document.documentElement.innerHTML;
    let match = /"__spin_b":"([^"]+)"/m.exec(html);
    if (match) return match[1];
    match = /__spin_b\s*\n\s*([A-Za-z0-9_\-]+)/m.exec(html);
    return match ? match[1] : '';
}

function getSpinT() {
    const html = document.documentElement.innerHTML;
    let match = /"__spin_t":(\d+)/m.exec(html);
    if (match) return match[1];
    match = /__spin_t\s*\n\s*(\d+)/m.exec(html);
    return match ? match[1] : '';
}

/**
 * Lấy ID người dùng từ cookie
 * @returns {string} - ID người dùng nếu tìm thấy, ngược lại là chuỗi rỗng
 */
function getUserId() {
    const regex = /c_user=(\d+);/gm;
    const resp = regex.exec(document.cookie);
    return resp ? resp[1] : '';
}

let lastReactStoryAt = 0;

/**
 * Gửi phản hồi (reaction) lên story
 * @param {string} user_id - ID người dùng
 * @param {string} fb_dtsg - Mã xác thực
 * @param {string} story_id - ID story
 * @param {string} message - Loại phản ứng (emoji) người dùng chọn
 * @returns {Promise} - Promise trả về kết quả phản hồi
 */
function reactStory(user_id, fb_dtsg, story_id, message) {
    return new Promise(async (resolve, reject) => {
        const now = Date.now();
        if (now - lastReactStoryAt < 250) {
            reject(new Error('RATE_LIMITED_CLIENT'));
            return;
        }
        lastReactStoryAt = now;
        const loadingToast = showToast('Sending request...', 'loading');
        const lsd = getLsd();
        const x_fb_lsd = getXFbLsd();
        const asbd_id = getAsbdId();
        const jazoest = getJazoest(fb_dtsg);
        const spin_r = getSpinR();
        const spin_b = getSpinB();
        const spin_t = getSpinT();
        // Dữ liệu gửi đi cho mutation GraphQL
        const variables = {
            input: {
                attribution_id_v2: `StoriesCometSuspenseRoot.react,comet.stories.viewer,via_extension,${Date.now()},,,,,`,
                lightweight_reaction_actions: {
                    offsets: [0],  // Đặt offset cho phản ứng
                    reaction: message,  // Loại phản ứng (emoji)
                },
                message: message,  // Tin nhắn phản hồi
                story_id: story_id,  // ID story
                story_reply_type: 'LIGHT_WEIGHT',
                actor_id: user_id,  // ID người dùng
                client_mutation_id: String(Math.floor(Math.random() * 1000000)),
            },
        };
        console.log(user_id, fb_dtsg)
        // Tạo body cho request
        const body = new URLSearchParams();
        body.append('av', user_id);  // ID người dùng
        body.append('__aaid', 0);
        body.append('__user', user_id);  // User ID cho xác thực
        body.append('__a', 1);  // Thông số yêu cầu
        body.append('__req', '10');
        body.append('__comet_req', '15');
        body.append('fb_dtsg', fb_dtsg);  // Mã fb_dtsg
        if (jazoest) body.append('jazoest', jazoest);
        if (lsd) body.append('lsd', lsd);
        if (spin_r) body.append('__spin_r', spin_r);
        if (spin_b) body.append('__spin_b', spin_b);
        if (spin_t) body.append('__spin_t', spin_t);
        body.append('fb_api_caller_class', 'RelayModern');
        body.append('fb_api_req_friendly_name', 'useStoriesSendReplyMutation');
        body.append('variables', JSON.stringify(variables));  // Dữ liệu gửi đi
        body.append('server_timestamps', true);
        body.append('doc_id', '9697491553691692');

        try {
            // Gửi yêu cầu POST tới Facebook API
            const response = await fetch('https://www.facebook.com/api/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': '*/*',
                    ...(asbd_id ? { 'x-asbd-id': asbd_id } : {}),
                    ...(x_fb_lsd ? { 'x-fb-lsd': x_fb_lsd } : {}),
                    'x-fb-friendly-name': 'useStoriesSendReplyMutation',
                },
                credentials: 'include',
                body,
            });

            if (response.status === 429) {
                updateToast(loadingToast.dataset.loadingId, 'Facebook is rate limiting (429). Wait 1-2 minutes then try again.', 'error');
                return reject({ status: 429 });
            }
            const res = await response.json();
            // Nếu có lỗi, reject Promise
            if (res.errors) {
                return reject(res);
            }
            // Hiển thị thông báo khi phản hồi thành công
            updateToast(loadingToast.dataset.loadingId, `You reacted with an emoji ${message}`, 'success');
            resolve(res);
        } catch (error) {
            // Nếu có lỗi trong quá trình gửi yêu cầu, reject Promise
            updateToast(loadingToast.dataset.loadingId, 'Request failed!', 'error');
            reject(error);
        }
    });
}