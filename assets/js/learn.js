(() => {
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
