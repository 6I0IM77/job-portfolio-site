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

const feedSwitchers = document.querySelectorAll("[data-feed-switcher]");
const projectVideos = document.querySelectorAll("[data-feed-card] video, [data-standalone-video]");
const standaloneVideos = document.querySelectorAll("[data-standalone-video]");
const feedControllers = [];
let activeFeedController = 0;

const getVideoSource = (video) => video?.currentSrc || video?.getAttribute("src") || video?.dataset.src || "";

const getVideoFallbackSource = (video) => video?.dataset.fallbackSrc || "";

const hasLoadedVideoSource = (video) => video?.dataset.videoLoaded === "true" || Boolean(video?.currentSrc || video?.getAttribute("src"));

const tryVideoFallback = (video) => {
    const fallbackSource = getVideoFallbackSource(video);

    if (!video || !fallbackSource || video.dataset.fallbackTried === "true") {
        return false;
    }

    if (video.getAttribute("src") === fallbackSource) {
        return false;
    }

    video.dataset.fallbackTried = "true";
    video.setAttribute("src", fallbackSource);
    video.load();
    return true;
};

const attachVideoFallback = (video) => {
    if (!video || video.dataset.fallbackAttached === "true") {
        return;
    }

    video.dataset.fallbackAttached = "true";
    video.addEventListener("error", () => {
        if (tryVideoFallback(video)) {
            video.play().catch(() => {});
        }
    });
};

const loadVideoSource = (video) => {
    const source = getVideoSource(video);

    if (!video || !source) {
        return "";
    }

    if (!video.getAttribute("src")) {
        delete video.dataset.fallbackTried;
        video.setAttribute("src", source);
        video.load();
    }

    video.dataset.videoLoaded = "true";
    return source;
};

const disableNativeVideoOverlays = (video) => {
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute("disablepictureinpicture", "");
    video.setAttribute("disableremoteplayback", "");
    video.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback nofullscreen");
};

document.querySelectorAll("video").forEach(disableNativeVideoOverlays);
document.querySelectorAll("video").forEach(attachVideoFallback);

const playStandalonePreviews = () => {
    standaloneVideos.forEach((video) => {
        if (!hasLoadedVideoSource(video)) {
            return;
        }

        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.loop = true;
        video.play().catch(() => {});
    });
};

const pauseStandalonePreviews = () => {
    standaloneVideos.forEach((video) => video.pause());
};

const activateFeedController = (index, options = {}) => {
    if (!feedControllers.length) {
        return;
    }

    activeFeedController = (index + feedControllers.length) % feedControllers.length;
    feedControllers[activeFeedController].start(options);
};

feedSwitchers.forEach((switcher, switcherIndex) => {
    const cards = [...switcher.querySelectorAll("[data-feed-card]")];
    let activeIndex = 0;
    let hasStarted = false;
    let timerId;
    let isControllerActive = false;
    let lastWheelAt = 0;
    let lastSwipeAt = 0;
    let touchStartX = 0;
      let touchStartY = 0;
      let pointerStartX = 0;
      let pointerStartY = 0;
      const lightbox = switcher.querySelector("[data-feed-lightbox]");
      const lightboxVideo = switcher.querySelector("[data-feed-lightbox-video]");
      const lightboxClose = switcher.querySelector("[data-feed-lightbox-close]");

    const seekVideo = (video, startTime) => {
        const seek = () => {
            const safeStart = Number.isFinite(video.duration)
                ? Math.min(startTime, Math.max(video.duration - 0.4, 0))
                : startTime;
            video.currentTime = safeStart;
        };

        if (video.readyState >= 1) {
            seek();
        } else {
            video.addEventListener("loadedmetadata", seek, { once: true });
        }
    };

      const applyCardState = () => {
          cards.forEach((card, index) => {
              const offset = (index - activeIndex + cards.length) % cards.length;
              card.classList.toggle("is-active", offset === 0);
              card.classList.toggle("is-next", offset === 1);
              card.classList.toggle("is-prev", cards.length > 2 && offset === cards.length - 1);
              card.setAttribute("aria-pressed", String(offset === 0));
            });
        };

      const openFullscreen = (card, video) => {
          if (card.requestFullscreen) {
              card.requestFullscreen().catch(() => {});
              return;
          }

          if (card.webkitRequestFullscreen) {
              card.webkitRequestFullscreen();
              return;
          }

          if (video.webkitEnterFullscreen) {
              video.webkitEnterFullscreen();
          }
      };
  
      const playActiveCard = ({ withSound = false, fullscreen = false } = {}) => {
          cards.forEach((card, index) => {
              const video = card.querySelector("video");
              const startTime = Number(card.dataset.start) || 0;

            if (!video) {
                return;
            }

            if (index !== activeIndex) {
                if (hasLoadedVideoSource(video)) {
                    video.pause();
                    seekVideo(video, startTime);
                }

                  return;
              }

              if (!hasLoadedVideoSource(video) && !withSound && !fullscreen) {
                  return;
              }

              loadVideoSource(video);
  
              video.muted = !withSound;
              video.volume = withSound ? 1 : 0;
              seekVideo(video, startTime);

              if (fullscreen) {
                  openFullscreen(card, video);
              }
  
              const playVideo = () => {
                  if (!isControllerActive || document.body.classList.contains("feed-viewer-open")) {
                      return;
                  }

                  video.play().catch(() => {});
            };

              if (video.readyState >= 1) {
                  if (withSound) {
                      playVideo();
                  } else {
                      window.setTimeout(playVideo, 80);
                  }
              } else {
                  video.addEventListener("loadedmetadata", playVideo, { once: true });
              }
          });
      };
  
      const switchTo = (index, options) => {
          activeIndex = (index + cards.length) % cards.length;
          applyCardState();
          playActiveCard(options);
      };

    const switchBy = (step) => {
        if (!isControllerActive) {
            activateFeedController(switcherIndex);
        }

        switchTo(activeIndex + step);
        restartTimer();
    };

      const restartTimer = () => {
          window.clearInterval(timerId);
          if (!isControllerActive) {
              return;
          }

          timerId = window.setInterval(() => {
              switchTo(activeIndex + 1);
          }, 6200);
      };

      const closeViewer = () => {
          if (!lightbox || !lightboxVideo) {
              return;
          }

          lightboxVideo.pause();
          lightboxVideo.removeAttribute("src");
          lightboxVideo.load();
          lightbox.hidden = true;
          document.body.classList.remove("feed-viewer-open");
          feedControllers.forEach((controller) => controller.start());
          playStandalonePreviews();
      };

      const openViewer = (card) => {
          if (!lightbox || !lightboxVideo) {
              return;
          }

          const sourceVideo = card.querySelector("video");

          if (!sourceVideo) {
              return;
          }

          const source = getVideoSource(sourceVideo);
          const fallbackSource = getVideoFallbackSource(sourceVideo);

          if (!source) {
              return;
          }

          feedControllers.forEach((controller) => controller.stop());
          projectVideos.forEach((video) => video.pause());
          pauseStandalonePreviews();
          document.body.appendChild(lightbox);
          disableNativeVideoOverlays(lightboxVideo);
          attachVideoFallback(lightboxVideo);
          delete lightboxVideo.dataset.fallbackTried;
          lightboxVideo.dataset.fallbackSrc = fallbackSource;
          lightboxVideo.src = source;
          lightboxVideo.muted = false;
          lightboxVideo.volume = 1;
          lightboxVideo.load();
          lightbox.hidden = false;
          document.body.classList.add("feed-viewer-open");
          lightboxVideo.play().catch(() => {});
      };

    const handleSwipe = (deltaX, deltaY) => {
        const now = Date.now();

        if (now - lastSwipeAt < 420) {
            return;
        }

        if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            lastSwipeAt = now;
            switchBy(deltaX < 0 ? 1 : -1);
        }
    };

        cards.forEach((card, index) => {
            card.addEventListener("click", () => {
                activateFeedController(switcherIndex);
                window.clearInterval(timerId);
                switchTo(index);
                openViewer(card);
          });
      });

      lightboxClose?.addEventListener("click", closeViewer);
      lightbox?.addEventListener("click", (event) => {
          if (event.target === lightbox) {
              closeViewer();
          }
      });

      document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && lightbox && !lightbox.hidden) {
              closeViewer();
          }
      });

    switcher.addEventListener("wheel", (event) => {
        const now = Date.now();
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

        if (Math.abs(delta) < 18 || now - lastWheelAt < 720) {
            return;
        }

        event.preventDefault();
        lastWheelAt = now;
        switchBy(delta > 0 ? 1 : -1);
    }, { passive: false });

    switcher.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true });

    switcher.addEventListener("touchend", (event) => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        handleSwipe(deltaX, deltaY);
    });

    switcher.addEventListener("pointerdown", (event) => {
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
    });

    switcher.addEventListener("pointerup", (event) => {
        handleSwipe(event.clientX - pointerStartX, event.clientY - pointerStartY);
    });

    switcher.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            event.preventDefault();
            switchBy(1);
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            switchBy(-1);
        }
    });

    const stop = () => {
        isControllerActive = false;
        window.clearInterval(timerId);
        cards.forEach((card) => {
            const video = card.querySelector("video");
            const startTime = Number(card.dataset.start) || 0;

            if (video) {
                if (hasLoadedVideoSource(video)) {
                    video.pause();
                    seekVideo(video, startTime);
                }
            }
        });
    };

    const start = ({ advance = false } = {}) => {
        isControllerActive = true;

        if (!hasStarted) {
            activeIndex = 0;
            hasStarted = true;
        } else if (advance) {
            activeIndex = (activeIndex + 1) % cards.length;
        }

        applyCardState();
        playActiveCard();
        restartTimer();
    };

    applyCardState();
    stop();
    feedControllers.push({ start, stop });
});

feedControllers.forEach((controller) => controller.start());
playStandalonePreviews();

const standaloneViewer = document.createElement("div");
standaloneViewer.className = "feed-lightbox";
standaloneViewer.hidden = true;
standaloneViewer.innerHTML = `
    <button class="feed-lightbox-close" type="button" aria-label="关闭视频">×</button>
    <video controls playsinline disablepictureinpicture disableremoteplayback controlslist="nodownload noplaybackrate noremoteplayback nofullscreen"></video>
`;

const standaloneViewerVideo = standaloneViewer.querySelector("video");
const standaloneViewerClose = standaloneViewer.querySelector(".feed-lightbox-close");
disableNativeVideoOverlays(standaloneViewerVideo);

const closeStandaloneViewer = () => {
    standaloneViewerVideo.pause();
    standaloneViewerVideo.removeAttribute("src");
    standaloneViewerVideo.load();
    standaloneViewer.hidden = true;
    document.body.classList.remove("feed-viewer-open");
    feedControllers.forEach((controller) => controller.start());
    playStandalonePreviews();
};

const openStandaloneViewer = (sourceVideo) => {
    const source = getVideoSource(sourceVideo);
    const fallbackSource = getVideoFallbackSource(sourceVideo);

    if (!source) {
        return;
    }

    feedControllers.forEach((controller) => controller.stop());
    projectVideos.forEach((video) => video.pause());
    pauseStandalonePreviews();
    document.body.appendChild(standaloneViewer);
    disableNativeVideoOverlays(standaloneViewerVideo);
    attachVideoFallback(standaloneViewerVideo);
    delete standaloneViewerVideo.dataset.fallbackTried;
    standaloneViewerVideo.dataset.fallbackSrc = fallbackSource;
    standaloneViewerVideo.src = source;
    standaloneViewerVideo.muted = false;
    standaloneViewerVideo.volume = 1;
    standaloneViewerVideo.load();
    standaloneViewer.hidden = false;
    document.body.classList.add("feed-viewer-open");
    standaloneViewerVideo.play().catch(() => {});
};

standaloneViewerClose.addEventListener("click", closeStandaloneViewer);
standaloneViewer.addEventListener("click", (event) => {
    if (event.target === standaloneViewer) {
        closeStandaloneViewer();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !standaloneViewer.hidden) {
        closeStandaloneViewer();
    }
});

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

    if (video.matches("[data-standalone-video]")) {
        const standaloneTrigger = video.closest("[data-standalone-trigger]") || video;

        standaloneTrigger.addEventListener("click", (event) => {
            event.preventDefault();
            openStandaloneViewer(video);
        });
    }

    if (video.readyState >= 1) {
        setVideoOrientation();
    }
});

document.addEventListener("fullscreenchange", () => {
    const fullscreenVideo = document.fullscreenElement?.matches(".project-visual > video")
        ? document.fullscreenElement
        : null;

    if (fullscreenVideo) {
        feedControllers.forEach((controller) => controller.stop());
        pauseStandalonePreviews();
        projectVideos.forEach((video) => {
            if (video !== fullscreenVideo) {
                video.pause();
            }
        });
        return;
    }

    if (!document.body.classList.contains("feed-viewer-open")) {
        feedControllers.forEach((controller) => controller.start());
        playStandalonePreviews();
    }
});
