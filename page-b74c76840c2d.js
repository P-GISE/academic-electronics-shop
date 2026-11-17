
        function login() {
            if (validateForm()) {
                alert("가입되었습니다.");
                // Redirect to a specific page after login (replace 'your_page.html' with the actual page URL)
                window.location.href = '카테고리.html';
            }
        }

        function validateForm() {
            var password = document.getElementById("password").value;
            var confirmPassword = document.getElementById("confirmPassword").value;
            var errorSpan = document.getElementById("passwordError");

            if (password !== confirmPassword) {
                errorSpan.style.display = "block";
                return false;
            } else {
                errorSpan.style.display = "none";
                return true;
            }
        }
    