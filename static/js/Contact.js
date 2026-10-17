document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("contactForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        // Check fields
        if (!name || !email || !subject || !message) {

            alert("Please fill all fields.");

            return;
        }


        /*
         * IMPORTANT:
         * खाली तुमचा WhatsApp number टाका.
         *
         * India साठी +91 नंतर number.
         * + किंवा spaces वापरू नका.
         *
         * Example:
         * 919876543210
         */

        let whatsappNumber = form.dataset.whatsapp ? form.dataset.whatsapp.replace(/[^0-9]/g, '') : '917219621129';
        const storeName = form.dataset.storename || 'Khamkar Dairy';

        if (!whatsappNumber.startsWith('91') && whatsappNumber.length === 10) {
            whatsappNumber = '91' + whatsappNumber;
        }

        // WhatsApp message
        const whatsappMessage =
            "🌿 *" + storeName + " - Contact Message*%0A%0A" +

            "👤 *Name:* " + encodeURIComponent(name) + "%0A" +

            "📧 *Email:* " + encodeURIComponent(email) + "%0A" +

            "📝 *Subject:* " + encodeURIComponent(subject) + "%0A%0A" +

            "💬 *Message:*%0A" +
            encodeURIComponent(message);


        // WhatsApp URL

        const whatsappURL =
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            whatsappMessage;


        // Open WhatsApp

        window.open(whatsappURL, "_blank");


        // Clear form

        form.reset();

    });

});