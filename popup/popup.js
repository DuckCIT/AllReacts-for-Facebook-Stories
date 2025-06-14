// Lấy phần tử toggle từ DOM
const toggle = document.getElementById('toggle-switch');

// Khi trạng thái của toggle thay đổi (chuyển qua lại giữa ON/OFF)
toggle.addEventListener('change', function () {
    const isChecked = toggle.checked; // Kiểm tra xem toggle có được bật hay không
    // Lưu trạng thái của toggle vào chrome.storage để lưu trữ dữ liệu
    chrome.storage.sync.set({ toggleState: isChecked }, function () {
        console.log('Toggle state saved:', isChecked); // Ghi log khi trạng thái đã được lưu
    });
});

// Tìm phần tử mũi tên (nút đóng popup)
const closeButton = document.querySelector('.close-btn');

// Lắng nghe sự kiện click vào mũi tên để đóng popup
closeButton.addEventListener('click', function () {
    window.close(); // Đóng popup khi nhấn vào mũi tên
});



// Khi popup được mở, đọc trạng thái toggle từ chrome.storage
chrome.storage.sync.get('toggleState', function (data) {
    // Nếu không có trạng thái lưu trước đó (lần đầu mở popup), mặc định là false
    toggle.checked = data.toggleState !== undefined ? data.toggleState : false;
});

document.querySelectorAll('.footer button').forEach(button => {
    const icon = button.querySelector('i');
    if (!icon) return;
    let url = null;
    if (icon.classList.contains('fa-github')) url = 'https://github.com/DuckCIT';
    if (icon.classList.contains('fa-code')) url = 'https://github.com/DuckCIT/AllReacts-for-Facebook-Stories';
    if (icon.classList.contains('fa-facebook')) url = 'https://facebook.com/tducxD';
    if (url) {
        button.addEventListener('click', () => chrome.tabs.create({ url }));
    }
});

// --- Footer Update Button Version Check ---
const updateButton = document.getElementById('update-button');
const currentVersion = chrome.runtime.getManifest().version;
const versionURL = 'https://raw.githubusercontent.com/DuckCIT/AllReacts-for-Facebook-Stories/main/data/version.json';

if (updateButton) {
    fetch(versionURL)
        .then(response => response.json())
        .then(data => {
            const latestVersion = data.version;
            const changelogURL = data.changelog;

            if (currentVersion !== latestVersion) {
                updateButton.title = `New version ${latestVersion} available! Click to see details.`;
                updateButton.style.color = 'var(--primary-color)';
                updateButton.style.animation = 'pulse 1.2s infinite';

                updateButton.addEventListener('click', () => {
                    chrome.tabs.create({ url: changelogURL });
                });
            } else {
                updateButton.title = `You're up to date! (v${currentVersion})`;
            }
        })
        .catch(error => {
            console.error('Failed to fetch version info:', error);
            updateButton.title = `Update check failed`;
        });
}
