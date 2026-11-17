
    function validateSelection() {
      const selectedColorButton = document.querySelector('.color-button.selected');
      const storageOptions = document.querySelectorAll('[name="storage"]');

      if (!selectedColorButton) {
        alert('색상을 선택하세요.');
        return;
      }

      let selectedStorageCount = 0;
      storageOptions.forEach(option => {
        if (option.checked) {
          selectedStorageCount++;
        }
      });

      if (selectedStorageCount !== 1) {
        alert('저장 용량을 하나만 선택하세요.');
        return;
      }

      window.location.href = '결제창.html';
    }

    function toggleButton(button) {
      const colorButtons = document.querySelectorAll('.color-button');
      colorButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    }

    function sing() {
      
      window.open('고객문의.html', 'Popup', 'width=400,height=400');
    }
  
    function showContent(contentId) {
  
    }
  
    function hhh() {
      
      window.open('장바구니.html', 'Popup', 'width=400,height=400');
    }
  
    function showContent(contentId) {
    }
  
    function log() {
      
      window.open('로그인 메인.html', 'Popup', 'width=400,height=400');
    }
  
    function showContent(contentId) {
    }
  