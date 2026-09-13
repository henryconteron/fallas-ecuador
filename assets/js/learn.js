(() => {
  const storyNav = document.querySelector("[data-story-nav]");

  if (storyNav) {
    const links = [...storyNav.querySelectorAll("[data-story-link]")];
    const sections = links
      .map((link) => document.querySelector(`[data-story-section="${link.dataset.storyLink}"]`))
      .filter(Boolean);
    const progress = storyNav.querySelector("[data-story-progress]");
    let frameRequested = false;

    const setActiveSection = (sectionId) => {
      links.forEach((link) => {
        const isActive = link.dataset.storyLink === sectionId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
          link.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const updateProgress = () => {
      frameRequested = false;
      if (!progress || sections.length === 0) return;
      const start = sections[0].offsetTop;
      const end = sections.at(-1).offsetTop + sections.at(-1).offsetHeight - window.innerHeight;
      const ratio = end <= start ? 1 : Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      progress.style.width = `${ratio * 100}%`;
    };

    const requestProgressUpdate = () => {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(updateProgress);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setActiveSection(visible.target.dataset.storySection);
        },
        { rootMargin: "-30% 0px -55%", threshold: [0, 0.1, 0.35] },
      );
      sections.forEach((section) => observer.observe(section));
    } else if (sections[0]) {
      setActiveSection(sections[0].dataset.storySection);
    }

    links.forEach((link) => {
      link.addEventListener("click", () => setActiveSection(link.dataset.storyLink));
    });
    window.addEventListener("hashchange", () => {
      const sectionId = window.location.hash.slice(1);
      if (links.some((link) => link.dataset.storyLink === sectionId)) {
        setActiveSection(sectionId);
      }
    });
    const initialSectionId = window.location.hash.slice(1);
    if (links.some((link) => link.dataset.storyLink === initialSectionId)) {
      setActiveSection(initialSectionId);
    }

    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", requestProgressUpdate);
    requestProgressUpdate();
  }

  const lab = document.querySelector("[data-field-lab]");
  if (!lab || !window.atlasI18n) return;

  const scenarios = [
    { id: "normal", answer: "normal" },
    { id: "reverse", answer: "reverse" },
    { id: "strike", answer: "strike" },
  ];
  const answerButtons = [...lab.querySelectorAll("[data-lab-answer]")];
  const scenes = [...lab.querySelectorAll("[data-lab-scene]")];
  const elements = {
    answers: lab.querySelector("[data-lab-answers]"),
    caseNumber: lab.querySelector("[data-lab-case]"),
    clue: lab.querySelector("[data-lab-clue]"),
    feedback: lab.querySelector("[data-lab-feedback]"),
    image: lab.querySelector("[data-lab-image]"),
    kicker: lab.querySelector("[data-lab-kicker]"),
    next: lab.querySelector("[data-lab-next]"),
    nextLabel: lab.querySelector("[data-lab-next] span"),
    progress: lab.querySelector("[data-lab-progress]"),
    progressBar: lab.querySelector("[data-lab-progress-bar]"),
    question: lab.querySelector("[data-lab-question]"),
    restart: lab.querySelector("[data-lab-restart]"),
  };

  let currentIndex = 0;
  let score = 0;
  let selectedAnswer = null;
  let showingResult = false;

  const t = (key) => window.atlasI18n.t(key);
  const interpolate = (value, replacements) =>
    Object.entries(replacements).reduce(
      (result, [key, replacement]) => result.replace(`{${key}}`, replacement),
      value,
    );

  function scenarioKey(suffix) {
    return `lab.scenario.${scenarios[currentIndex].id}.${suffix}`;
  }

  function renderFeedback() {
    if (!selectedAnswer) {
      elements.feedback.hidden = true;
      elements.feedback.textContent = "";
      return;
    }

    const isCorrect = selectedAnswer === scenarios[currentIndex].answer;
    elements.feedback.hidden = false;
    elements.feedback.dataset.state = isCorrect ? "correct" : "incorrect";
    elements.feedback.innerHTML = "";

    const heading = document.createElement("strong");
    heading.textContent = t(isCorrect ? "lab.correct" : "lab.incorrect");
    const explanation = document.createElement("span");
    explanation.textContent = t(scenarioKey("explanation"));
    elements.feedback.append(heading, explanation);
  }

  function renderScenario() {
    const scenario = scenarios[currentIndex];
    const position = currentIndex + 1;
    elements.caseNumber.textContent = String(position).padStart(2, "0");
    elements.progress.textContent = interpolate(t("lab.progress"), {
      current: position,
      total: scenarios.length,
    });
    elements.progressBar.value = position;
    elements.progressBar.max = scenarios.length;
    elements.progressBar.textContent = elements.progress.textContent;
    elements.kicker.textContent = t(scenarioKey("kicker"));
    elements.question.textContent = t(scenarioKey("question"));
    elements.clue.textContent = t(scenarioKey("clue"));
    elements.image.setAttribute("aria-label", t(scenarioKey("imageAlt")));
    elements.nextLabel.textContent = t(
      currentIndex === scenarios.length - 1 ? "lab.results" : "lab.next",
    );

    scenes.forEach((scene) => {
      scene.classList.toggle("is-active", scene.dataset.labScene === scenario.id);
    });
    answerButtons.forEach((button) => {
      const answer = button.dataset.labAnswer;
      const isSelected = answer === selectedAnswer;
      button.disabled = Boolean(selectedAnswer);
      button.classList.toggle("is-selected", isSelected);
      button.classList.toggle(
        "is-correct",
        Boolean(selectedAnswer) && answer === scenario.answer,
      );
      button.classList.toggle(
        "is-incorrect",
        isSelected && answer !== scenario.answer,
      );
    });

    renderFeedback();
  }

  function renderResult() {
    showingResult = true;
    elements.answers.hidden = true;
    elements.next.hidden = true;
    elements.restart.hidden = false;
    elements.kicker.textContent = t("lab.resultKicker");
    elements.question.textContent = t("lab.resultTitle");
    elements.clue.textContent = interpolate(t("lab.resultCopy"), {
      score,
      total: scenarios.length,
    });
    elements.feedback.hidden = false;
    elements.feedback.dataset.state = score === scenarios.length ? "correct" : "neutral";
    elements.feedback.innerHTML = "";
    const message = document.createElement("strong");
    message.textContent = t(
      score === scenarios.length ? "lab.resultPerfect" : "lab.resultEncourage",
    );
    elements.feedback.append(message);
  }

  function answer(selected) {
    if (selectedAnswer || showingResult) return;
    selectedAnswer = selected;
    if (selected === scenarios[currentIndex].answer) score += 1;
    elements.next.hidden = false;
    renderScenario();
    elements.feedback.focus({ preventScroll: true });
  }

  function next() {
    if (!selectedAnswer) return;
    if (currentIndex === scenarios.length - 1) {
      renderResult();
      elements.restart.focus();
      return;
    }
    currentIndex += 1;
    selectedAnswer = null;
    elements.next.hidden = true;
    renderScenario();
    elements.question.focus({ preventScroll: true });
  }

  function restart() {
    currentIndex = 0;
    score = 0;
    selectedAnswer = null;
    showingResult = false;
    elements.answers.hidden = false;
    elements.next.hidden = true;
    elements.restart.hidden = true;
    renderScenario();
    answerButtons[0].focus();
  }

  answerButtons.forEach((button) => {
    button.addEventListener("click", () => answer(button.dataset.labAnswer));
  });
  elements.next.addEventListener("click", next);
  elements.restart.addEventListener("click", restart);
  window.addEventListener("atlas:languagechange", () => {
    if (showingResult) renderResult();
    else renderScenario();
  });

  elements.question.tabIndex = -1;
  elements.feedback.tabIndex = -1;
  renderScenario();
})();
