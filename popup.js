document.addEventListener("DOMContentLoaded", async () => {
  const imageContainer = document.getElementById('imageContainer');
  const downloadButton = document.getElementById('downloadButton');
  const selectAllButton = document.getElementById('selectAllButton');
  const minWidthInput = document.getElementById('minWidth');
  const maxWidthInput = document.getElementById('maxWidth');
  const minHeightInput = document.getElementById('minHeight');
  const maxHeightInput = document.getElementById('maxHeight');
  const folderNameInput = document.getElementById('folderName');
  const fileNamePrefixInput = document.getElementById('fileNamePrefix');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let images = [];

  // ページが読み込まれるたびに画像リストをリセット
  resetImageList();

  // 画像をページから取得する
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => Array.from(document.images, img => {
      function removeNameParam(url) {
        return url.split('&name=')[0];  // &name=以降を削除
      }
      return {
        src: img.src,
        naturalSrc: removeNameParam(img.src),  // 元画像のURLを生成
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    }),
  }, (results) => {
    images = results[0].result;
    renderImages(images);
  });

  // 画像を表示する関数
  function renderImages(imagesToRender) {
    imageContainer.innerHTML = ''; // リストをリセット
    imagesToRender.forEach((image, index) => {
      const div = document.createElement('div');
      div.classList.add('image-item');

      const img = document.createElement('img');
      img.src = image.src;

      div.appendChild(img);
      imageContainer.appendChild(div);

      // クリックで選択・解除
      div.addEventListener('click', () => {
        div.classList.toggle('selected');
      });
    });
  }

  // リストをリセットする関数
  function resetImageList() {
    imageContainer.innerHTML = ''; // コンテナの中身を空にする
    images = [];  // 画像のリストもリセット
  }

  // 全選択ボタンのイベント
  selectAllButton.addEventListener('click', () => {
    const imageItems = document.querySelectorAll('.image-item');
    imageItems.forEach(item => {
      item.classList.add('selected');
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
    const folderName = folderNameInput.value || 'Downloaded Images';  // フォルダ名を取得
    const fileNamePrefix = fileNamePrefixInput.value || 'image_';  // ファイル名プレフィックスを取得

    const selectedImages = Array.from(document.querySelectorAll('.image-item.selected'))
      .map(item => {
        const imgElement = item.querySelector('img');
        const image = images.find(img => img.src === imgElement.src);
        return image.naturalSrc;  // naturalSrcを使用して元の画像URLを保存
      });

    chrome.runtime.sendMessage({
      type: 'downloadImages',
      imagesToDownload: selectedImages,
      options: { 
        folder_name: folderName,  // ユーザーが入力したフォルダ名
        new_file_name: fileNamePrefix  // ユーザーが入力したファイル名プレフィックス
      }
    });
  });
});
