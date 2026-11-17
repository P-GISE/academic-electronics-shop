
    function processPayment() {
      // 입력된 정보 가져오기
      const shippingAddress = document.getElementById('shippingAddress').value;
      const quantity = document.getElementById('quantity').value;
      const paymentMethod = document.getElementById('paymentMethod').value;

      // 여기에서 서버로 결제 정보 전송하는 로직을 추가해야 합니다.

      // 결제 완료 메시지 표시
      displayPurchaseMessage();
    }

    function displayPurchaseMessage() {
      const purchaseMessage = document.getElementById('purchaseCompleteMessage');
      purchaseMessage.style.display = 'block';
    }

    function redirectToMain() {
      // 여기에서 실제 메인 페이지로의 이동 로직을 추가합니다.
      // 예를 들어, 현재는 경고창을 띄우는 예시를 제공합니다.
      alert('메인 페이지로 이동합니다.');
      window.location.href = '카테고리.html';
    }
  