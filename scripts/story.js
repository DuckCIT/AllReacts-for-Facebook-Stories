var EMOJI_LIST = null; // Giữ emoji trong bộ nhớ

// Mảng lưu trữ tất cả các toast đang hiển thị
var toasts = [];

async function loadEmojis() {
    if (EMOJI_LIST) {
        loadModal(EMOJI_LIST); // Nếu đã tải trước đó, không cần fetch lại
        return;
    }

    try {
        const url = extension.runtime.getURL('data/emoji.json');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        EMOJI_LIST = await response.json(); // Lưu vào biến toàn cục
        loadModal(EMOJI_LIST);
    } catch (e) {
        showToast("Failed to load emojis.");
    }
}

(async () => {
    if (document.getElementsByClassName('btn-react').length > 0) return;
    loadEmojis(); // Chỉ tải lại emoji khi cần
})();


function getEmojiNameFromUrl(url) {
    // Tách URL thành các phần nhỏ bằng dấu '/'
    const parts = url.split('/');

    // Lấy phần cuối cùng của URL, đó là tên file
    const fileName = parts[parts.length - 1];

    // Lấy tên emoji từ tên file (trước dấu '_') và thay thế dấu '-' bằng dấu cách
    const emojiName = fileName.split('_')[0].replace(/-/g, ' ');

    return emojiName;
}

function checkUpdate(linkWithTooltip) {
    // Gửi tin nhắn đến background script để kiểm tra version
    extension.runtime.sendMessage({ action: "checkUpdate" }, (response) => {
        if (extension.runtime.lastError) {
            return; // Bỏ qua lỗi nếu có
        }
        const data = response.data;
        const currentVersion = extension.runtime.getManifest().version;
        if (data.version > currentVersion) {
            linkWithTooltip.setAttribute('tooltip', 'Please check for update here v' + data.version);
            linkWithTooltip.setAttribute('href', 'https://github.com/DuckCIT/AllReacts-for-Facebook-Stories');
            setTimeout(() => {
                linkWithTooltip.classList.add('show-tooltip');
            }, 500);
            setTimeout(() => {
                linkWithTooltip.classList.remove('show-tooltip');
            }, 3000);
        } else if (data.donate) {
            linkWithTooltip.setAttribute('tooltip', 'Click here to visit the author\'s support page ☕︎');
            linkWithTooltip.setAttribute('href', data.donate);
        }
    });
}

function loadModal(EMOJI_LIST) {
    // Lấy fb_dtsg và user_id
    const fb_dtsg = getFbdtsg();
    const user_id = getUserId();
    // Tạo nút react
    const btnReact = document.createElement('div');
    btnReact.setAttribute('class', 'btn-react');
    btnReact.innerHTML = `
    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="4" x2="12" y2="20" stroke="white" stroke-width="3" stroke-linecap="round"></line>
        <line x1="4" y1="12" x2="20" y2="12" stroke="white" stroke-width="3" stroke-linecap="round"></line>
    </svg>
    `;

    // Tạo nhóm emoji
    const emojiGroup = document.createElement('ul');
    emojiGroup.setAttribute('class', 'emoji-group');

    // Tạo container menu
    const menuContainer = document.createElement('div');
    menuContainer.setAttribute('class', 'menu-container');

    // Tạo tiêu đề và tiêu đề phụ cho menu
    const title = document.createElement('span');
    title.setAttribute('class', 'title');
    title.textContent = 'AllReacts Facebook Stories';
    title.setAttribute('tooltip', 'If you reacted but don’t see your reaction on the story, try refreshing the page (F5).');

    const subTitle = document.createElement('span');
    subTitle.setAttribute('class', 'sub-title');
    subTitle.innerHTML = 'Developed by <a tooltip="No new updates available" href="https://www.facebook.com/tducxD" target="_blank" style="color: #00a1f1;">Nguyen Trong Duc</a>';

    const linkWithTooltip = subTitle.querySelector('a[tooltip]');
    let updateChecked = false;

    // Thêm tiêu đề và tiêu đề phụ vào menu container
    menuContainer.appendChild(title);
    menuContainer.appendChild(subTitle);

    // Biến timeout để xử lý sự kiện mouseover/mouseout
    let timeout;

    // Xử lý khi chuột di vào nút react
    btnReact.addEventListener('mouseover', () => {
        btnReact.style.scale = '1.2';
        btnReact.style.border = '1.5px solid white';
        menuContainer.classList.add('show');
        rotateIcon(45);
        if (!updateChecked) {
            checkUpdate(linkWithTooltip);
            updateChecked = true;
        }
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

    // Lấy lịch sử emoji từ localStorage
    const emojiHistory = JSON.parse(localStorage.getItem('emojiHistory')) || [];

    // Thêm emoji từ lịch sử vào nhóm emoji
    groupEmoji(fb_dtsg, user_id, emojiGroup, emojiHistory);

    // Lọc emoji mới chưa có trong lịch sử
    const filteredEmojiList = EMOJI_LIST.filter(emoji =>
        !emojiHistory.some(historyItem => historyItem.value === emoji.value)
    );

    // Thêm emoji mới vào nhóm emoji
    groupEmoji(fb_dtsg, user_id, emojiGroup, filteredEmojiList);

    // Thêm nhóm emoji vào menu container
    menuContainer.appendChild(emojiGroup);

    // Tạo phần "More Reactions"
    const moreReactions = document.createElement('div');
    moreReactions.setAttribute('class', 'more-reactions');
    moreReactions.appendChild(btnReact);
    moreReactions.appendChild(menuContainer);

    // Kiểm tra và tạo nút react, tạo menu
    const injectInitialMoreReactions = () => {
        const storiesFooter = document.querySelector('.x11lhmoz.x78zum5.x1q0g3np.xsdox4t.x10l6tqk.xtzzx4i.xwa60dl.xl56j7k.xtuxyv6');
        if (!storiesFooter) return false;

        const defaultReactions = Array.from(storiesFooter.querySelectorAll('.x78zum5.xl56j7k'))
            .find(el => el.offsetWidth === 336);
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
        const storiesFooter = document.querySelector('.x11lhmoz.x78zum5.x1q0g3np.xsdox4t.x10l6tqk.xtzzx4i.xwa60dl.xl56j7k.xtuxyv6');
        if (!storiesFooter) return false;

        const defaultReactions = Array.from(storiesFooter.querySelectorAll('.x78zum5.xl56j7k'))
            .find(el => el.offsetWidth === 336);
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


// Biến trạng thái story (đang dừng hay không)
var storyState = false;

// Hàm tìm nút phát/tạm dừng story
function getButton() {
    // Lấy tất cả các nút với role="button"
    const buttons = document.querySelectorAll('[role="button"]');

    // Chuyển NodeList thành mảng và tìm nút chứa div có lớp cụ thể
    return Array.from(buttons).find(button =>
        button.querySelector('div.x1ypdohk.xdj266r.xw3qccf.xat24cr.xsgj6o6')
    );
}

// Hàm thêm emoji vào nhóm emoji
function groupEmoji(fb_dtsg, user_id, emojiGroup, emojiList) {
    let tooltipTimeout;
    const svgPath = 'svg path[d="m18.477 12.906-9.711 5.919A1.148 1.148 0 0 1 7 17.919V6.081a1.148 1.148 0 0 1 1.766-.906l9.711 5.919a1.046 1.046 0 0 1 0 1.812z"]';

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
        tooltip.textContent = getEmojiNameFromUrl(emoji.url);

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
                saveEmojiToHistory(emoji.value, emoji.url);
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

function saveEmojiToHistory(emojiValue, emojiImageUrl) {
    // Lấy lịch sử emoji từ localStorage (nếu không có thì khởi tạo mảng rỗng)
    let emojiHistory = JSON.parse(localStorage.getItem('emojiHistory')) || [];

    // Tạo đối tượng emoji mới
    const emoji = { value: emojiValue, url: emojiImageUrl };

    // Kiểm tra xem emoji đã tồn tại trong lịch sử hay chưa
    const emojiIndex = emojiHistory.findIndex(item => item.value === emojiValue);

    // Nếu emoji đã có trong lịch sử, xóa nó khỏi mảng
    if (emojiIndex !== -1) {
        emojiHistory.splice(emojiIndex, 1);
    }

    // Thêm emoji mới vào đầu mảng
    emojiHistory.unshift(emoji);

    // Nếu số lượng emoji trong lịch sử vượt quá 10, xóa emoji cũ nhất
    if (emojiHistory.length > 10) {
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
    const htmlStory = document.getElementsByClassName('xh8yej3 x1n2onr6 xl56j7k x5yr21d x78zum5 x6s0dn4');
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

/**
 * Lấy ID người dùng từ cookie
 * @returns {string} - ID người dùng nếu tìm thấy, ngược lại là chuỗi rỗng
 */
function getUserId() {
    const regex = /c_user=(\d+);/gm;
    const resp = regex.exec(document.cookie);
    return resp ? resp[1] : '';
}

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
        const loadingToast = showToast('Sending request...', 'loading');
        // Dữ liệu gửi đi cho mutation GraphQL
        const variables = {
            input: {
                lightweight_reaction_actions: {
                    offsets: [0],  // Đặt offset cho phản ứng
                    reaction: message,  // Loại phản ứng (emoji)
                },
                message: message,  // Tin nhắn phản hồi
                story_id: story_id,  // ID story
                story_reply_type: 'LIGHT_WEIGHT',
                actor_id: user_id,  // ID người dùng
                client_mutation_id: 7,
            },
        };

        // Tạo body cho request
        const body = new URLSearchParams();
        body.append('av', user_id);  // ID người dùng
        body.append('__user', user_id);  // User ID cho xác thực
        body.append('__a', 1);  // Thông số yêu cầu
        body.append('fb_dtsg', fb_dtsg);  // Mã fb_dtsg
        body.append('fb_api_caller_class', 'RelayModern');
        body.append('fb_api_req_friendly_name', 'useStoriesSendReplyMutation');
        body.append('variables', JSON.stringify(variables));  // Dữ liệu gửi đi
        body.append('server_timestamps', true);
        body.append('doc_id', '3769885849805751');

        try {
            // Gửi yêu cầu POST tới Facebook API
            const response = await fetch('https://www.facebook.com/api/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body,
            });
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
