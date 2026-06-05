const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const sectionLinks = document.querySelectorAll(".nav-links a");

navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("open");
});

sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
    });
});

const sections = [...sectionLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            return;
        }

        sectionLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("active", isActive);
        });
    });
}, { rootMargin: "-40% 0px -50% 0px" });

sections.forEach((section) => observer.observe(section));

document.querySelectorAll("[data-scroll-top]").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        if (window.history.replaceState) {
            window.history.replaceState(null, "", window.location.pathname);
        }
    });
});

const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector("#formNote");

if (contactForm && formNote) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get("name") || "招聘方";
        const message = formData.get("message") || "你好，我想进一步了解你的作品集。";
        const subject = encodeURIComponent("个人作品集沟通");
        const body = encodeURIComponent(`${name}：\n\n${message}\n\n期待进一步沟通。`);

        formNote.textContent = "已生成邮件草稿，请在弹出的邮件窗口中替换真实邮箱后发送。";
        window.location.href = `mailto:your-email@example.com?subject=${subject}&body=${body}`;
    });
}

const projectVideos = document.querySelectorAll(".project-visual video");

projectVideos.forEach((video) => {
    const setVideoOrientation = () => {
        if (!video.videoWidth || !video.videoHeight) {
            return;
        }

        const isPortrait = video.videoHeight > video.videoWidth;
        video.classList.toggle("portrait-video", isPortrait);
        video.classList.toggle("landscape-video", !isPortrait);
    };

    video.addEventListener("loadedmetadata", setVideoOrientation);
    video.addEventListener("play", () => {
        projectVideos.forEach((otherVideo) => {
            if (otherVideo !== video) {
                otherVideo.pause();
            }
        });
    });

    if (video.readyState >= 1) {
        setVideoOrientation();
    }
});
