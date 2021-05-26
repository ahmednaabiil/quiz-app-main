const container = document.getElementById('content');
const nextBtn = document.getElementById('next');

let NO_OF_QUES = 10;
let current = 0;
let optionSelected;
let finalTime;
let timerElem;
let timerLoop;

let questions = [];
let answers = [];


const startQuiz = (e) => {
  e.preventDefault();
  container.innerHTML = '<span class="loader"></span>';
  const formData = new FormData(e.target);
  const category = formData.get('category');
  const difficulty = formData.get('difficulty');
  NO_OF_QUES = formData.get('number')
  setQuestions(category, difficulty);
}


const setQuestions = async (category, difficulty) => {
  url = `https://opentdb.com/api.php?amount=${NO_OF_QUES}&type=multiple`;
  url += `&category=${category}&difficulty=${difficulty}`;

  const entries = await fetch(url)
    .then(res => res.json())
    .then(res => res.results);

  entries.forEach(q => {
    const a = {
      question: q.question,
      answer: q.correct_answer,
      options: q.incorrect_answers
    }
    const randomPos = Math.floor(Math.random() * 3);
    a.options.splice(randomPos, 0, a.answer);
    questions.push(a);
  })

  localStorage.setItem('questions', JSON.stringify(questions));
  localStorage.setItem('answers', JSON.stringify(answers));
  finalTime = new Date().getTime() + 1000 * 60 * NO_OF_QUES;
  localStorage.setItem('time', finalTime);
  showQuestion(current);
  startTimer();
}


const startTimer = () => {
  timerElem = document.createElement('span');
  timerElem.classList.add('timer');
  document.body.appendChild(timerElem);
  timer();
  timerLoop = setInterval(timer, 1000);
}


const timer = () => {
  let time = finalTime - new Date().getTime();
  if(time < 0) {
    getResults();
  }
  let minutes = `${Math.floor(time / 60000)}`;
  let seconds = `${Math.floor(time % (60000) / 1000)}`;
  time = `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  timerElem.innerHTML = time;
  document.title = `(${time}) - Quiz App`;
}


const clearTimer = () => {
  timerElem.remove();
  clearInterval(timerLoop);

  document.title = 'Quiz App';
}


const showQuestion = (index) => {
  localStorage.setItem('current', index);
  optionSelected = -1;
  let notAnswered = '';
  let firstQuestion = '';
  let nextButtonValue = 'Next';

  if(index == NO_OF_QUES - 1)
    nextButtonValue = 'Submit';
  else if(index == 0)
    firstQuestion = 'disabled';

  let options = ``;
  if(answers.length > index)
    optionSelected = answers[index];
  else
    notAnswered = 'disabled';

  questions[index].options.forEach((option, i) => {
    let selected = '';
    if(i == optionSelected)
      selected = 'checked';
    options += `
    <label class="quiz--option">
      <input class="quiz--input" type="radio" name="option" value="${i}" onclick="setAnswer(this)" ${selected}>
      ${option}
    </label>
    `;
  });

  const innerHTML = `
  <article class="quiz">
    <span class="quiz--number">${index + 1}</span>
    <p class="quiz--question">${questions[index].question}</p>
    <div class="quiz--options">
      ${options}
    </div>
    <div class="quiz--navigation">
      <button class="button quiz--action" onclick="previousQuestion()" ${firstQuestion}>Prev</button>
      <button id="next" class="button quiz--action" onclick="nextQuestion()" ${notAnswered}>${nextButtonValue}</button>
    </div>
  </article>
  `;

  container.innerHTML = innerHTML;
}


const setAnswer = (e) => {
  optionSelected = e.value;
  next.removeAttribute('disabled');
}


const nextQuestion = () => {
  storeAnswer();
  if(current == NO_OF_QUES - 1) {
    finalTime = new Date().getTime();
    localStorage.setItem('time', finalTime);
    getResults();
  } else
    showQuestion(++current);
}


const previousQuestion = () => {
  storeAnswer();
  showQuestion(--current);
}


const storeAnswer = () => {
  if(optionSelected > -1) {
    answers[current] = optionSelected;
    localStorage.setItem('answers', JSON.stringify(answers));
  }
}


const getResults = () => {
  clearTimer();

  let score = 0;
  for(let i = 0; i < answers.length; i++) {
    let choice = questions[i].options[answers[i]];
    if(questions[i].answer == choice)
      score++;
  }

  let now = new Date().getTime();
  if(now - finalTime > 600000)
    localStorage.clear();

  let reviewed = '';
  if(localStorage.getItem('questions') === null)
    reviewed = 'hide';

  container.innerHTML = `
  <p class="quiz--score">You scored ${score} out of ${NO_OF_QUES}</p>
  <div class="quiz--navigation">
    <a href="/index.html" class="button navigation--action" onclick="clearStorage(event)">Home</a>
    <button class="button navigation--action ${reviewed}" onclick="showAnswer(0)">Review</button>
    <a href="/quiz.html" class="button navigation--action" onclick="clearStorage(event)">Play Again</a>
  </div>
  `;
}

const showAnswer = (index) => {
  if(index == NO_OF_QUES) {
    localStorage.clear();
    return getResults();
  }

  localStorage.setItem('current', index);
  let firstQuestion = '';
  let nextButtonValue = 'Next';
  if(index == 0)
    firstQuestion = 'disabled';
  if(index == NO_OF_QUES - 1)
    nextButtonValue = 'End Review';

  let answer = questions[index].answer;
  let options = '';
  questions[index].options.forEach((option, i) => {
    let correct =  '';
    let incorrect = '';
    if(option === answer)
      correct = 'correct';
    if(i == answers[index])
      incorrect = 'incorrect';
    options += `
    <label class="quiz--option ${incorrect} ${correct}">
      ${option}
    </label>
    `;
  });

  const innerHTML = `
  <article class="quiz">
    <span class="quiz--number">${index + 1}</span>
    <p class="quiz--question">${questions[index].question}</p>
    <div class="quiz--options">
      ${options}
    </div>
    <div class="quiz--navigation">
      <button class="button quiz--action" onclick="showAnswer(${index - 1})" ${firstQuestion}>Prev</button>
      <button id="next" class="button quiz--action" onclick="showAnswer(${index + 1})">${nextButtonValue}</button>
    </div>
  </article>
  `;

  container.innerHTML = innerHTML;
}


const clearStorage = (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = e.target.href;
}


if(localStorage.getItem('questions') !== null) {
  questions = JSON.parse(localStorage.getItem('questions'))
  finalTime = localStorage.getItem('time');
  current = parseInt(localStorage.getItem('current'));
  answers = JSON.parse(localStorage.getItem('answers'));
  NO_OF_QUES = questions.length;
  showQuestion(current);
  startTimer();
}
