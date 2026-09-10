document.addEventListener("DOMContentLoaded", function () {

    const loginForm =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const togglePassword =
        document.getElementById("togglePassword");

    const loginBtn =
        document.getElementById("loginBtn");

    const emailError =
        document.getElementById("emailError");

    const passwordError =
        document.getElementById("passwordError");

    const forgotPassword =
        document.getElementById("forgotPassword");


    /* =====================================
       SHOW / HIDE PASSWORD
    ===================================== */

    togglePassword.addEventListener(
        "click",
        function () {

            if (
                passwordInput.type === "password"
            ) {

                passwordInput.type = "text";

                togglePassword.textContent = "🙈";

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type = "password";

                togglePassword.textContent = "👁";

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        }
    );


    /* =====================================
       CLEAR ERROR
    ===================================== */

    emailInput.addEventListener(
        "input",
        function () {

            emailError.textContent = "";

            emailInput.style.borderColor =
                "";
        }
    );


    passwordInput.addEventListener(
        "input",
        function () {

            passwordError.textContent = "";

            passwordInput.style.borderColor =
                "";
        }
    );


    /* =====================================
       VALIDATE EMAIL / MOBILE
    ===================================== */

    function validateEmailOrMobile(value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobilePattern = /^[6-9][0-9]{9}$/;
        const usernamePattern = /^[a-zA-Z0-9_@.+-]{3,}$/;

        return (
            emailPattern.test(value) ||
            mobilePattern.test(value) ||
            usernamePattern.test(value)
        );
    }


    /* =====================================
       LOGIN FORM
    ===================================== */

    loginForm.addEventListener(
        "submit",
        function (event) {


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value.trim();


            let valid = true;


            /* Email / Username / Mobile */

            if (email === "") {

                emailError.textContent =
                    "Please enter your email, username, or mobile number.";

                emailInput.style.borderColor =
                    "#d93025";

                valid = false;

            } else if (
                !validateEmailOrMobile(email)
            ) {

                emailError.textContent =
                    "Enter a valid email, username, or 10-digit mobile number.";

                emailInput.style.borderColor =
                    "#d93025";

                valid = false;
            }


            /* Password */

            if (password === "") {

                passwordError.textContent =
                    "Please enter your password.";

                passwordInput.style.borderColor =
                    "#d93025";

                valid = false;

            } else if (password.length < 6) {

                passwordError.textContent =
                    "Password must contain at least 6 characters.";

                passwordInput.style.borderColor =
                    "#d93025";

                valid = false;
            }


            if (!valid) {
                event.preventDefault();
                return;
            }


            /* =================================
               LOGIN BUTTON LOADING
            ================================= */

            loginBtn.classList.add("loading");

            loginBtn.innerHTML =
                `<span>⏳</span>
                 <span>Logging in...</span>`;

            /* Form will submit naturally to Django backend */

        }
    );


    /* =====================================
       FORGOT PASSWORD
    ===================================== */

    forgotPassword.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            alert(
                "Password reset feature will be available soon."
            );

        }
    );

});