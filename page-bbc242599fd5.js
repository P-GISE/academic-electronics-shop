
        function login() {
            alert("로그인되었습니다.");
            // Redirect to a specific page after login (replace 'your_page.html' with the actual page URL)
            window.location.href = '카테고리.html';
        }

        function validateForm() {
            var password = document.getElementById("password").value;
            var confirmPassword = document.getElementById("confirmPassword").value;
            var errorSpan = document.getElementById("passwordError");

            if (password !== confirmPassword) {
                errorSpan.textContent = "비밀번호가 일치하지 않습니다.";
                return false;
            } else {
                errorSpan.textContent = "";
                return true;
            }
        }
    