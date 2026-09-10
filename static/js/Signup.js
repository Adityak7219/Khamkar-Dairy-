/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirm_password");

const showPassword =
    document.getElementById("showPassword");

const showConfirmPassword =
    document.getElementById("showConfirmPassword");


if (showPassword) {

    showPassword.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            showPassword.textContent = "🙈";

        } else {

            passwordInput.type = "password";

            showPassword.textContent = "👁";

        }

    });

}


if (showConfirmPassword) {

    showConfirmPassword.addEventListener("click", function () {

        if (confirmPasswordInput.type === "password") {

            confirmPasswordInput.type = "text";

            showConfirmPassword.textContent = "🙈";

        } else {

            confirmPasswordInput.type = "password";

            showConfirmPassword.textContent = "👁";

        }

    });

}


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

const lengthRule =
    document.getElementById("lengthRule");

const letterRule =
    document.getElementById("letterRule");

const specialRule =
    document.getElementById("specialRule");


passwordInput.addEventListener("input", function () {

    const password = passwordInput.value;


    /* 8 characters */

    if (password.length >= 8) {

        lengthRule.classList.add("valid");

    } else {

        lengthRule.classList.remove("valid");

    }


    /* Letters + numbers */

    if (
        /[A-Za-z]/.test(password) &&
        /[0-9]/.test(password)
    ) {

        letterRule.classList.add("valid");

    } else {

        letterRule.classList.remove("valid");

    }


    /* Special character */

    if (
        /[^A-Za-z0-9]/.test(password)
    ) {

        specialRule.classList.add("valid");

    } else {

        specialRule.classList.remove("valid");

    }

});


/* =========================================================
   MOBILE NUMBER
========================================================= */

const mobileInput =
    document.getElementById("mobile");


mobileInput.addEventListener("input", function () {

    this.value =
        this.value.replace(/\D/g, "");

});


/* =========================================================
   SIGNUP FORM
========================================================= */

const signupForm =
    document.getElementById("signupForm");


signupForm.addEventListener("submit", function (event) {

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    const terms =
        document.getElementById("terms");


    /* Password length */

    if (password.length < 8) {

        event.preventDefault();

        alert(
            "Password must contain at least 8 characters."
        );

        return;

    }


    /* Letters and numbers */

    if (
        !/[A-Za-z]/.test(password) ||
        !/[0-9]/.test(password)
    ) {

        event.preventDefault();

        alert(
            "Password must contain letters and numbers."
        );

        return;

    }


    /* Special character */

    if (
        !/[^A-Za-z0-9]/.test(password)
    ) {

        event.preventDefault();

        alert(
            "Password must contain a special character."
        );

        return;

    }


    /* Confirm password */

    if (password !== confirmPassword) {

        event.preventDefault();

        alert(
            "Password and Confirm Password do not match."
        );

        return;

    }


    /* Terms */

    if (!terms.checked) {

        event.preventDefault();

        alert(
            "Please accept Terms & Conditions."
        );

        return;

    }

});


/* =========================================================
   GOOGLE SIGNUP
========================================================= */

const googleSignup =
    document.getElementById("googleSignup");


if (googleSignup) {

    googleSignup.addEventListener("click", function () {

        alert(
            "Google Sign Up will work after Google authentication is configured."
        );

    });

}