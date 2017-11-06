/* eslint-disable no-use-before-define,no-underscore-dangle,no-param-reassign,no-console */
import PouchDB from 'pouchdb';
import './style/base.css';
import './style/bg.png';

const ENTER_KEY = 13;
const newTodoDom = document.getElementById('new-todo');
const syncDom = document.getElementById('sync-wrapper');

// EDITING STARTS HERE (you don't need to edit anything above this line)

const db = new PouchDB('todos');
const remoteCouch = `http://${process.env.DB_LOGIN}:${process.env.DB_PASS}@95.85.26.56:5984/todos`;

db.changes({
  since: 'now',
  live: true,
}).on('change', showTodos);

// We have to create a new todo document and enter it in the database
function addTodo(text) {
  const todo = {
    _id: new Date().toISOString(),
    title: text,
    completed: false,
  };
  db.put(todo, (err) => {
    if (!err) {
      console.log('Successfully posted a todo!');
    }
  });
}

// Show the current list of todos by reading them from the database
function showTodos() {
  db.allDocs({ include_docs: true, descending: true }, (err, doc) => {
    redrawTodosUI(doc.rows);
  });
}

function checkboxChanged(todo, event) {
  todo.completed = event.target.checked;
  db.put(todo);
}

// User pressed the delete button for a todo, delete it
function deleteButtonPressed(todo) {
  db.remove(todo);
}

// The input box when editing a todo has blurred, we should save
// the new title or delete the todo if the title is empty
function todoBlurred(todo, event) {
  const trimmedText = event.target.value.trim();
  if (!trimmedText) {
    db.remove(todo);
  } else {
    todo.title = trimmedText;
    db.put(todo);
  }
}

// There was some form or error syncing
function syncError() {
  syncDom.setAttribute('data-sync-state', 'error');
}

// Initialise a sync with the remote server
function sync() {
  syncDom.setAttribute('data-sync-state', 'syncing');
  const opts = { live: true };
  db.replicate.to(remoteCouch, opts, syncError).on('error', (err) => {
    console.log(err);
  });
  db.replicate.from(remoteCouch, opts, syncError);
}

// User has double clicked a todo, display an input so they can edit the title
function todoDblClicked(todo) {
  const div = document.getElementById(`li_${todo._id}`);
  const inputEditTodo = document.getElementById(`input_${todo._id}`);
  div.className = 'editing';
  inputEditTodo.focus();
}

// If they press enter while editing an entry, blur it to trigger save
// (or delete)
function todoKeyPressed(todo, event) {
  if (event.keyCode === ENTER_KEY) {
    const inputEditTodo = document.getElementById(`input_${todo._id}`);
    inputEditTodo.blur();
  }
}

// Given an object representing a todo, this will create a list item
// to display it.
function createTodoListItem(todo) {
  const checkbox = document.createElement('input');
  checkbox.className = 'toggle';
  checkbox.type = 'checkbox';
  checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

  const label = document.createElement('label');
  label.appendChild(document.createTextNode(todo.title));
  label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

  const deleteLink = document.createElement('button');
  deleteLink.className = 'destroy';
  deleteLink.addEventListener('click', deleteButtonPressed.bind(this, todo));

  const divDisplay = document.createElement('div');
  divDisplay.className = 'view';
  divDisplay.appendChild(checkbox);
  divDisplay.appendChild(label);
  divDisplay.appendChild(deleteLink);

  const inputEditTodo = document.createElement('input');
  inputEditTodo.id = `input_${todo._id}`;
  inputEditTodo.className = 'edit';
  inputEditTodo.value = todo.title;
  inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
  inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

  const li = document.createElement('li');
  li.id = `li_${todo._id}`;
  li.appendChild(divDisplay);
  li.appendChild(inputEditTodo);

  if (todo.completed) {
    li.className += 'complete';
    checkbox.checked = true;
  }

  return li;
}

function redrawTodosUI(todos) {
  const ul = document.getElementById('todo-list');
  ul.innerHTML = '';
  todos.forEach((todo) => {
    ul.appendChild(createTodoListItem(todo.doc));
  });
}

function newTodoKeyPressHandler(event) {
  if (event.keyCode === ENTER_KEY) {
    addTodo(newTodoDom.value);
    newTodoDom.value = '';
  }
}

function addEventListeners() {
  newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
}

addEventListeners();
showTodos();

if (remoteCouch) {
  sync();
}
