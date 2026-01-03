document.addEventListener("DOMContentLoaded", () => {
  // Get all summary elements
  const summaries = document.querySelectorAll(".accordion__quesion");
  // Add click event listener to each summary
  summaries.forEach((summary) => {
    summary.addEventListener("click", function (e) {
      // Prevent the default toggle behavior
      e.preventDefault();

      // Get the details element that contains this summary
      const currentDetails = this.parentElement;

      // Find the closest section parent
      const parentSection = currentDetails.closest("section");

      if (parentSection) {
        // Find all details elements within this section
        const allDetails = parentSection.querySelectorAll(
          "details.accordion__item"
        );

        // Close all other details elements in this section
        allDetails.forEach((details) => {
          if (details !== currentDetails) {
            details.removeAttribute("open");
          }
        });

        // Toggle the current details element
        if (currentDetails.hasAttribute("open")) {
          currentDetails.removeAttribute("open");
        } else {
          currentDetails.setAttribute("open", "");
        }
      }
    });
  });

  const embla__sliders = document.querySelectorAll(".embla");

  embla__sliders.forEach((embla__slider) => {
    // Read data attributes
    const slidesToScroll__mobile =
      embla__slider.getAttribute("data-slides-mobile") || 1;
    const slidesToScroll__tab =
      embla__slider.getAttribute("data-slides-tab") || 1;
    const slidesToScroll__desk =
      embla__slider.getAttribute("data-slides-desk") || 1;

    const mobile__only = embla__slider.getAttribute("data-mobile-only") || 0;
    const embla__loop = embla__slider.hasAttribute("data-embla-loop");
    const vertical = embla__slider.hasAttribute("data-vertical");
    const center = embla__slider.hasAttribute("data-center");

    // ⭐ NEW FEATURE (desktop only)
    const centerScale = embla__slider.hasAttribute("data-scale-center");

    const hasProgress = embla__slider.hasAttribute("data-embla-progress");

    // Desktop detection
    const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

    // Wrapper: only activate scale-center on desktop
    const centerScaleActive = () => centerScale && isDesktop();

    const axis = vertical ? "y" : "x";

    function buildOptions() {
      const scaleActive = centerScaleActive();

      const alignValue = scaleActive || center ? "center" : "start";
      const loopValue = scaleActive ? true : embla__loop;
      const scrollValue = scaleActive ? 1 : slidesToScroll__mobile;

      let options = {};

      if (mobile__only == "1") {
        options = {
          loop: loopValue,
          align: alignValue,
          axis,
          slidesToScroll: scrollValue,
          containScroll: "trimSnaps",
          breakpoints: {
            "(min-width: 768px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__tab
            },
            "(min-width: 1280px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__desk
            }
          }
        };
      } else {
        options = {
          loop: loopValue,
          align: alignValue,
          axis,
          containScroll: "trimSnaps",
          slidesToScroll: scrollValue,
          breakpoints: {
            "(min-width: 768px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__tab
            },
            "(min-width: 992px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__desk
            }
          }
        };
      }

      return options;
    }

    const viewportNode = embla__slider.querySelector(".embla__viewport");
    const prevButtonNode = embla__slider.querySelector(".embla__arrow--prev");
    const nextButtonNode = embla__slider.querySelector(".embla__arrow--next");
    const dotsNode = embla__slider.querySelector(".embla__dots");
    const slideNodes = embla__slider.querySelectorAll(".embla__slide");

    const progressNode = embla__slider.querySelector(".embla__progress");
    const progressBarNode = embla__slider.querySelector(".embla__progress-bar");

    const handleSlideVideos = () => {
      if (isDesktop()) return;

      slideNodes.forEach((slide, index) => {
        const video = slide.querySelector(".embla__video");
        if (!video) return;

        if (index === emblaApi.selectedScrollSnap()) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    // Init Embla
    const emblaApi = EmblaCarousel(viewportNode, buildOptions());

    // Re-init on resize to enforce desktop-only scale mode
    window.addEventListener("resize", () => {
      emblaApi.reInit(buildOptions());
      updateActiveSlide();
    });

    // Buttons
    prevButtonNode?.addEventListener("click", emblaApi.scrollPrev);
    nextButtonNode?.addEventListener("click", emblaApi.scrollNext);

    const toggleArrowButtonsState = () => {
      if (prevButtonNode) {
        const canScrollPrev = emblaApi.canScrollPrev();
        prevButtonNode.disabled = !canScrollPrev;
        prevButtonNode.classList.toggle("is-disabled", !canScrollPrev);
      }
      if (nextButtonNode) {
        const canScrollNext = emblaApi.canScrollNext();
        nextButtonNode.disabled = !canScrollNext;
        nextButtonNode.classList.toggle("is-disabled", !canScrollNext);
      }
    };

    // Dots
    let dotNodes = [];

    const addDotBtnsWithClickHandlers = () => {
      if (!dotsNode) return;

      const snapCount = emblaApi.scrollSnapList().length;
      if (snapCount <= 1) {
        dotsNode.innerHTML = "";
        return;
      }

      dotsNode.innerHTML = emblaApi
        .scrollSnapList()
        .map(() => '<span class="embla__dot" type="button"></span>')
        .join("");

      dotNodes = [...dotsNode.querySelectorAll(".embla__dot")];
      dotNodes.forEach((dotNode, index) =>
        dotNode.addEventListener("click", () => emblaApi.scrollTo(index))
      );
    };

    const toggleDotBtnsActive = () => {
      if (!dotsNode || dotNodes.length === 0) return;

      const previous = emblaApi.previousScrollSnap();
      const selected = emblaApi.selectedScrollSnap();

      dotNodes[previous]?.classList.remove("embla__dot--selected");
      dotNodes[selected]?.classList.add("embla__dot--selected");
    };

    // ⭐ NEW: Desktop-only active-slide scaling
    const updateActiveSlide = () => {
      const scaleActive = centerScaleActive();

      slideNodes.forEach((slide) => slide.classList.remove("active-slide"));

      if (!scaleActive) return;

      const selected = emblaApi.selectedScrollSnap();
      slideNodes[selected]?.classList.add("active-slide");
    };

    const updateProgressBar = () => {
      if (!hasProgress || !progressBarNode) return;

      requestAnimationFrame(() => {
        const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
        progressBarNode.style.transform = `scaleX(${progress})`;
      });
    };

    const handleProgressClick = (event) => {
      if (!hasProgress || !progressNode) return;

      const rect = progressNode.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const progress = clickX / rect.width;
      const targetScroll = progress * emblaApi.scrollSnapList().length;

      emblaApi.scrollTo(Math.round(targetScroll));
    };

    if (hasProgress && progressNode) {
      progressNode.addEventListener("click", handleProgressClick);
    }

    // Events
    emblaApi
      .on("init", toggleArrowButtonsState)
      .on("select", toggleArrowButtonsState)
      .on("reInit", toggleArrowButtonsState)
      .on("init", addDotBtnsWithClickHandlers)
      .on("reInit", addDotBtnsWithClickHandlers)
      .on("init", toggleDotBtnsActive)
      .on("reInit", toggleDotBtnsActive)
      .on("select", toggleDotBtnsActive)

      // ⭐ activate scaling
      .on("init", updateActiveSlide)
      .on("select", updateActiveSlide)
      .on("reInit", updateActiveSlide)

      .on("init", updateProgressBar)
      .on("scroll", updateProgressBar)
      .on("reInit", updateProgressBar)

      .on("init", handleSlideVideos)
      .on("scroll", handleSlideVideos)
      .on("reInit", handleSlideVideos);
  });

  // Before-After Slider Tab functionality
  (() => {
    const sliderSection = document.querySelector(".rn-before-after-slider-tab");
    if (!sliderSection) return;

    const genderTabs = sliderSection.querySelectorAll(".rn-before-after-slider-tab__gender-tab");
    const typeTabs = sliderSection.querySelectorAll(".rn-before-after-slider-tab__type-tab");
    const panels = sliderSection.querySelectorAll(".rn-before-after-slider-tab__panel");

    let currentGender = "female";
    let currentType = "hocker";

    const emblaInstances = new Map();

    function initializeEmblaForPanel(panel) {
      const viewportNode = panel.querySelector(".embla__viewport");
      const prevButton = panel.querySelector(".embla__prev");
      const nextButton = panel.querySelector(".embla__next");

      if (!viewportNode) return;

      const options = {
        loop: false,
        align: "start",
        slidesToScroll: 1,
        containScroll: "trimSnaps",
        breakpoints: {
          "(min-width: 768px)": {
            slidesToScroll: 1
          },
          "(min-width: 992px)": {
            slidesToScroll: 1
          }
        }
      };

      const emblaApi = EmblaCarousel(viewportNode, options);

      const toggleButtonsState = () => {
        if (prevButton) {
          const canScrollPrev = emblaApi.canScrollPrev();
          prevButton.disabled = !canScrollPrev;
        }
        if (nextButton) {
          const canScrollNext = emblaApi.canScrollNext();
          nextButton.disabled = !canScrollNext;
        }
      };

      prevButton?.addEventListener("click", () => {
        emblaApi.scrollPrev();
      });

      nextButton?.addEventListener("click", () => {
        emblaApi.scrollNext();
      });

      emblaApi
        .on("init", toggleButtonsState)
        .on("select", toggleButtonsState)
        .on("reInit", toggleButtonsState);

      return emblaApi;
    }

    function updateActivePanel() {
      panels.forEach((panel) => {
        const panelGender = panel.dataset.gender;
        const panelType = panel.dataset.type;
        const isActive = panelGender === currentGender && panelType === currentType;

        panel.classList.toggle("active", isActive);

        if (isActive && !emblaInstances.has(panel)) {
          const emblaApi = initializeEmblaForPanel(panel);
          if (emblaApi) {
            emblaInstances.set(panel, emblaApi);
          }
        }
      });
    }

    genderTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        genderTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentGender = tab.dataset.gender;
        updateActivePanel();
      });
    });

    typeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        typeTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentType = tab.dataset.type;
        updateActivePanel();
      });
    });

    updateActivePanel();
  })();

  // RN Steps Accordion functionality
  (() => {
    const stepsSection = document.querySelector(".rn-steps");
    if (!stepsSection) return;

    const cards = stepsSection.querySelectorAll(".rn-steps__card");
    const readMoreButtons = stepsSection.querySelectorAll(".rn-steps__read-more");

    readMoreButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const stepNumber = this.getAttribute("data-step-trigger");
        const targetCard = stepsSection.querySelector(`.rn-steps__card[data-step="${stepNumber}"]`);
        
        if (!targetCard) return;

        // Check if the clicked card is already active
        const isAlreadyActive = targetCard.classList.contains("rn-steps__card--active");
        
        if (isAlreadyActive) return; // Don't do anything if already active

        // Remove active state from all cards and add collapsed state
        cards.forEach((card) => {
          card.classList.remove("rn-steps__card--active");
          card.classList.add("rn-steps__card--collapsed");
          
          // Hide checklist for all cards
          const checklist = card.querySelector(".rn-steps__checklist");
          if (checklist) {
            checklist.classList.add("rn-steps__checklist--hidden");
          }

          // Update card content background
          const cardContent = card.querySelector(".rn-steps__card-content");
          if (cardContent) {
            cardContent.classList.remove("rn-steps__card-content--blue");
            cardContent.classList.add("rn-steps__card-content--light");
          }

          // Update title color
          const cardTitle = card.querySelector(".rn-steps__card-title");
          if (cardTitle) {
            cardTitle.classList.remove("rn-steps__card-title--white");
            cardTitle.classList.add("rn-steps__card-title--black");
          }

          // // Update check icons to black version
          // const checkIcons = card.querySelectorAll(".rn-steps__checklist-icon-img");
          // checkIcons.forEach((icon) => {
          //   icon.src = "assets/images/check-circle.svg";
          // });

          // Update checklist text color to black
          const checklistTexts = card.querySelectorAll(".rn-steps__checklist-text");
          checklistTexts.forEach((text) => {
            text.style.color = "var(--Black)";
          });

          // Reset icon rotation
          const icon = card.querySelector(".rn-steps__read-more-icon");
          if (icon) {
            icon.classList.remove("rn-steps__read-more-icon--rotated");
          }
        });

        // Add active state to clicked card
        targetCard.classList.add("rn-steps__card--active");
        targetCard.classList.remove("rn-steps__card--collapsed");

        // Show checklist for active card
        const activeChecklist = targetCard.querySelector(".rn-steps__checklist");
        if (activeChecklist) {
          activeChecklist.classList.remove("rn-steps__checklist--hidden");
        }

        // Update card content background to blue
        const activeCardContent = targetCard.querySelector(".rn-steps__card-content");
        if (activeCardContent) {
          activeCardContent.classList.remove("rn-steps__card-content--light");
          activeCardContent.classList.add("rn-steps__card-content--blue");
        }

        // Update title color to white
        const activeCardTitle = targetCard.querySelector(".rn-steps__card-title");
        if (activeCardTitle) {
          activeCardTitle.classList.remove("rn-steps__card-title--black");
          activeCardTitle.classList.add("rn-steps__card-title--white");
        }

        // Update check icons to white version
        // const activeCheckIcons = targetCard.querySelectorAll(".rn-steps__checklist-icon-img");
        // activeCheckIcons.forEach((icon) => {
        //   icon.src = "assets/images/check.svg";
        // });

        // Update checklist text color to white
        const activeChecklistTexts = targetCard.querySelectorAll(".rn-steps__checklist-text");
        activeChecklistTexts.forEach((text) => {
          text.style.color = "var(--White-Bg)";
        });

        // Rotate icon for active card
        const activeIcon = targetCard.querySelector(".rn-steps__read-more-icon");
        if (activeIcon) {
          activeIcon.classList.add("rn-steps__read-more-icon--rotated");
        }

        // Hide the read more button for the active card
        const activeButton = targetCard.querySelector(".rn-steps__read-more");
        if (activeButton) {
          activeButton.style.display = "none";
        }

        // Show read more buttons for inactive cards
        cards.forEach((card) => {
          if (card !== targetCard) {
            const inactiveButton = card.querySelector(".rn-steps__read-more");
            if (inactiveButton) {
              inactiveButton.style.display = "flex";
            }
          }
        });
      });
    });

    // Initialize: Hide the read more button for the first card (active by default)
    const firstCard = stepsSection.querySelector('.rn-steps__card[data-step="1"]');
    if (firstCard) {
      const firstButton = firstCard.querySelector(".rn-steps__read-more");
      if (firstButton) {
        firstButton.style.display = "none";
      }
    }
  })();

});

window.addEventListener("load", function () {
  document.querySelectorAll(".rn-custom-vimeo")?.forEach(function (e) {
    e.addEventListener("click", function () {
      document.querySelectorAll(".rn-custom-vimeo").forEach(function (e) {
        e.classList.remove("active");
      });
      const t = this.getAttribute("data-vimeo-id"),
        o = document.createElement("iframe"),
        l = e.querySelector(".rn-custom-vimeo__iframe-wrp");
      (o.src = "https://player.vimeo.com/video/" + t + "?autoplay=1"),
        (o.frameBorder = "0"),
        (o.allow = "autoplay; fullscreen; picture-in-picture"),
        (o.style.width = "100%"),
        (o.style.height = "100%"),
        (o.style.position = "absolute"),
        (o.style.top = "0"),
        (o.style.left = "0"),
        (o.allowFullscreen = !0),
        (l.innerHTML = ""),
        e.classList.add("active"),
        l.appendChild(o);
    });
  });
});
