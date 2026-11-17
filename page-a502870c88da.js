
     document.addEventListener("DOMContentLoaded", function () {
  const categoryContents = document.querySelectorAll('.category .content');

  categoryContents.forEach(function (content) {
    content.style.display = 'none'; // 페이지 로드 시 모든 카테고리 숨기기
  });

  const categoryButtons = document.querySelectorAll('.category button');

  categoryButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      const currentContent = categoryContents[index];

      const displayStyle = window.getComputedStyle(currentContent).getPropertyValue('display');

      if (displayStyle === 'none' || displayStyle === '') {
        categoryContents.forEach(function (content) {
          content.style.display = 'none';
        });
        currentContent.style.display = 'block';
      } else {
        currentContent.style.display = 'none';
      }
    });
  });
});

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



      