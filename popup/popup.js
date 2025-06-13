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
document.querySelectorAll(".extension-info").forEach(function (item) {
    item.addEventListener("click", function () {
        const url = this.getAttribute("data-url");
        if (chrome.tabs) {
            chrome.tabs.create({ url: url });
        } else {
            window.open(url, "_blank");
        }
    });
});


// Khi popup được mở, đọc trạng thái toggle từ chrome.storage
chrome.storage.sync.get('toggleState', function (data) {
    // Nếu không có trạng thái lưu trước đó (lần đầu mở popup), mặc định là false
    toggle.checked = data.toggleState !== undefined ? data.toggleState : false;
});

// --- UPDATE NOTIFICATION LOGIC ---
const popupContainer = document.getElementById('popup');

fetch('https://raw.githubusercontent.com/DuckCIT/AllReacts-for-Facebook-Stories/main/data/version.json')
    .then(response => response.json())
    .then(data => {
        chrome.runtime.getManifest ? checkAndShowUpdate(data.version, data.donate) : null;
    });

function checkAndShowUpdate(latestVersion, donateUrl) {
    const currentVersion = chrome.runtime.getManifest().version;
    if (compareVersions(latestVersion, currentVersion) > 0) {
        fetchChangelogAndShow(latestVersion);
    } else if (donateUrl) {
        // Optionally, show donate message
    }
}

function compareVersions(v1, v2) {
    // Compare version strings like '1.0.8' vs '1.0.7'
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

function showUpdatePopup(newVersion, changelog) {
    // Remove previous notification if exists
    const old = document.getElementById('update-notification');
    if (old) old.remove();
    const notif = document.createElement('div');
    notif.id = 'update-notification';
    notif.className = 'update-popup-simple';
    notif.innerHTML = `
        <div><br><b>New update available: v${newVersion}!</b></div>
        <div style="margin-top:4px; font-size:12px; color:#c9d1d9; white-space:pre-line;">${changelog ? changelog : 'Visit GitHub for more details.'}</div>
    `;
    popupContainer.appendChild(notif);
}

// Lấy changelog mới nhất từ GitHub
function fetchChangelogAndShow(version) {
    fetch('https://raw.githubusercontent.com/DuckCIT/AllReacts-for-Facebook-Stories/main/CHANGELOG.md')
        .then(res => res.text())
        .then(md => {
            // Tìm changelog cho version mới nhất
            const regex = new RegExp(`## v${version.replace(/\./g, '\\.')}(.*?)(?=## v|$)`, 's');
            const match = md.match(regex);
            let log = '';
            if (match) {
                log = match[1].replace(/^- /gm, '• ').trim();
            }
            showUpdatePopup(version, log);
        })
        .catch(() => showUpdatePopup(version, 'Visit GitHub for more details.'));
}
