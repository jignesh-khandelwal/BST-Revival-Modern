document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".primary-nav");

    if (menuButton && navigation) {
        menuButton.addEventListener("click", function () {
            const isOpen = navigation.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", String(isOpen));
        });
    }

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".primary-nav a").forEach(function (link) {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.setAttribute("aria-current", "page");
        }
    });

    const feedbackForm = document.querySelector("#feedbackForm");

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = document.querySelector("#feedbackName").value.trim();
            const email = document.querySelector("#feedbackEmail").value.trim();
            const subject = document.querySelector("#feedbackSubject").value.trim();
            const message = document.querySelector("#feedbackMessage").value.trim();

            if (!email || !message) {
                alert("Please enter your email address and feedback.");
                return;
            }

            const emailSubject = subject || "Binary Tree Visualiser Feedback";

            const emailBody =
                "Name: " + (name || "Not provided") + "\n" +
                "Email: " + email + "\n\n" +
                "Feedback:\n" + message;

            const mailtoLink =
                "mailto:memoriesofphotosvideos@gmail.com" +
                "?subject=" + encodeURIComponent(emailSubject) +
                "&body=" + encodeURIComponent(emailBody);

            window.location.href = mailtoLink;
        });
    }
});
