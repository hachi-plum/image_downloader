document.addEventListener("DOMContentLoaded", async () => {
  const imageContainer = document.getElementById('imageContainer');
  const downloadButton = document.getElementById('downloadButton');
  const selectAllButton = document.getElementById('selectAllButton');
  const minWidthInput = document.getElementById('minWidth');
  const maxWidthInput = document.getElementById('maxWidth');
  const minHeightInput = document.getElementById('minHeight');
  const maxHeightInput = document.getElementById('maxHeight');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let images = [];

  // ページが読み込まれるたびに画像リストをリセット
  resetImageList();

  // 画像をページから取得する
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => Array.from(document.images, img => ({
      src: img.src,
      width: img.naturalWidth,
      height: img.naturalHeight
    })),
  }, (results) => {
    images = results[0].result;
    renderImages(images);
  });

  // 画像を表示する関数
  function renderImages(imagesToRender) {
    imageContainer.innerHTML = ''; // リストをリセット
    imagesToRender.forEach((image) => {
      const div = document.createElement('div');
      div.classList.add('image-item');

      const img = document.createElement('img');
      img.src = image.src;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = image.src;

      div.appendChild(img);
      div.appendChild(checkbox);
      imageContainer.appendChild(div);
    });
  }

  // リストをリセットする関数
  function resetImageList() {
    imageContainer.innerHTML = ''; // コンテナの中身を空にする
    images = [];  // 画像のリストもリセット
  }

  // 全選択ボタンのイベント
  selectAllButton.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
  });

  // 画像幅と高さの入力変更イベント
  minWidthInput.addEventListener('input', filterImages);
  maxWidthInput.addEventListener('input', filterImages);
  minHeightInput.addEventListener('input', filterImages);
  maxHeightInput.addEventListener('input', filterImages);

  // 画像の幅と高さでフィルタリングする関数
  function filterImages() {
    const minWidth = parseInt(minWidthInput.value);
    const maxWidth = parseInt(maxWidthInput.value);
    const minHeight = parseInt(minHeightInput.value);
    const maxHeight = parseInt(maxHeightInput.value);
    const filteredImages = images.filter(image => 
      image.width >= minWidth && image.width <= maxWidth &&
      image.height >= minHeight && image.height <= maxHeight
    );
    renderImages(filteredImages);
  }

  // ダウンロードボタンのイベント
  downloadButton.addEventListener('click', () => {
    const selectedImages = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => checkbox.value);

    chrome.runtime.sendMessage({
      type: 'downloadImages',
      imagesToDownload: selectedImages,
      options: { folder_name: 'Downloaded Images', new_file_name: 'image_' }
    });
  });
});
