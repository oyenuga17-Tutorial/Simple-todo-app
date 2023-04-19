"use strict";
const UI = {
  themeBtn: document.getElementById("theme-btn"),
  todoInputForm: document.querySelector(".input-form"),
  todoInput: document.querySelector(".header-input"),
  todoItemsContainer: document.querySelector(".todo-list"),
  allBtn: document.querySelector(".btnAll"),
  activeBtn: document.querySelector(".btnActive"),
  completedBtn: document.querySelector(".btnCompleted"),
  filterBtns: document.querySelectorAll(".btnFilter"),
  activeTasksCount: document.querySelector(".todoItems-number"),
  clearCompletedBtn: document.querySelector(".clearCompleted-btn"),
  taskRemoveBtn: document.querySelector(".todo-item__remove-btn"),
  editBtn: document.querySelector(".edit-btn"),
  formBtn: document.querySelector(".form-btn"),
};

const fromLocalStorage = JSON.parse(localStorage.getItem("tasksData"));
let data = fromLocalStorage || [];

let dragSrcEl;
const themeStyleSheet = document.getElementById("themeStyleSheet");

function generateTaskMarkup(id, desc, isCompleted = "false") {
  return `
        <li class="todo-item ${
          isCompleted === "true" ? "done" : ""
        }" draggable="true" id="${id}" 
        data-complete="${isCompleted}">
           <input
           type="checkbox"
           name="complete"
           class="todo-item__checkbox"
           ${isCompleted === "true" ? "checked" : ""}
           />
           <p class="todo-item__text">${desc}</p>
           
           <button class="todo-item__remove-btn btn edit-btn">
           <i class="fa-regular fa-pen-to-square"></i>
           </button>
          <button class="todo-item__remove-btn btn">
           <img src="./images/icon-cross.svg" alt="Delete task button" />
          </button>
        </li>
     `;
}
const displayTasksCount = () => {
  const tasksCount = localStorage.getItem("activeTasksCount");
  if (tasksCount) {
    UI.activeTasksCount.textContent = tasksCount;
  }
};

const renderUI = () => {
  if (data.length === 0) return;

  UI.todoItemsContainer.innerHTML = "";
  data.forEach((task) => {
    const markup = generateTaskMarkup(task.id, task.desc, task.isCompleted);
    UI.todoItemsContainer.insertAdjacentHTML("beforeend", markup);
  });

  displayTasksCount();
};
renderUI();
const storeTasks = () => {
  localStorage.setItem("tasksData", JSON.stringify(data));

  const activeTasksCount = data.filter(
    (task) => task.isCompleted === "false"
  ).length;
  localStorage.setItem("activeTasksCount", activeTasksCount);
};

UI.themeBtn.addEventListener("click", (e) => {
  const themeName = e.target.dataset.theme;
  themeStyleSheet.href = `./css/${themeName}Theme.css`;
  UI.themeBtn.dataset.theme = themeName === "light" ? "dark" : "light";
  localStorage.setItem("prevSetTheme", themeName);
});

UI.todoInputForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (UI.formBtn.textContent === "Save") {
    editLocalStorage(UI.formBtn.id, UI.todoInput.value);
    UI.formBtn.textContent = "Add";
    UI.todoInput.value = "";
    return;
  }
  const task = {
    id: new Date().getTime(),
    desc: UI.todoInput.value,
    isCompleted: "false",
  };

  if (task.desc === "") return;
  const markup = generateTaskMarkup(task.id, task.desc);
  data.push(task);

  if (UI.todoItemsContainer.firstElementChild?.className === "message")
    UI.todoItemsContainer.innerHTML = "";

  UI.todoItemsContainer.insertAdjacentHTML("beforeend", markup);
  UI.todoInput.value = "";
  storeTasks();
  displayTasksCount();
});

const dragStartHandler = (ev) => {
  let sourceItem = ev.target.closest(".todo-item");
  const theme = localStorage.getItem("prevSetTheme");
  // sourceItem.style.background = theme == "dark" ? "#212336" : "#e6e6e6";

  ev.dataTransfer.setData("itemId", sourceItem.id);
  ev.dataTransfer.effectAllowed = "move";
  ev.dataTransfer.setData("text/html", sourceItem.innerHTML);
  dragSrcEl = sourceItem;
};

const dragOverHandler = (ev) => {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = "move";
  let targetItem = ev.target.closest(".todo-item");
  const theme = localStorage.getItem("prevSetTheme");
  targetItem.style.background = theme == "dark" ? "#212336" : "#e6e6e6";
  return false;
};

const dragLeaveHandler = (ev) => {
  let targetItem = ev.target.closest(".todo-item");
  if (targetItem === dragSrcEl) return;
  targetItem.style.background = "";
};

const dropHandler = (ev) => {
  let targetItem = ev.target.closest(".todo-item");
  let id = ev.dataTransfer.getData("itemId");
  let sourceItem = document.getElementById(id);
  // targetItem.parentElement.insertBefore(sourceItem, targetItem.nextSibling);

  if (dragSrcEl.innerHTML !== targetItem.innerHTML) {
    const srcAttributes = [...sourceItem.attributes].map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));
    const targetAttributes = [...targetItem.attributes].map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));

    const srcTargetIndices = [];
    data.filter((task, index) => {
      if (
        task.id === Number(targetItem.id) ||
        task.id === Number(dragSrcEl.id)
      ) {
        srcTargetIndices.push(index);
        return true;
      }
    });
    // Swapping tasks in data array
    [data[srcTargetIndices[0]], data[srcTargetIndices[1]]] = [
      data[srcTargetIndices[1]],
      data[srcTargetIndices[0]],
    ];

    dragSrcEl.innerHTML = targetItem.innerHTML;
    targetItem.innerHTML = ev.dataTransfer.getData("text/html");

    // Swap the attributes of tasks
    targetAttributes.forEach((attr) =>
      sourceItem.setAttribute(attr.name, attr.value)
    );
    srcAttributes.forEach((attr) =>
      targetItem.setAttribute(attr.name, attr.value)
    );
    console.log(srcAttributes, targetAttributes);
  }
  targetItem.style.background = "";
  sourceItem.style.background = "";
  storeTasks();
};

const dragDropHandlers = [
  dragStartHandler,
  dragOverHandler,
  dragLeaveHandler,
  dropHandler,
];

["dragstart", "dragover", "dragleave", "drop"].forEach((event, ind) => {
  UI.todoItemsContainer.addEventListener(event, dragDropHandlers[ind]);
});

UI.todoItemsContainer.addEventListener("click", (ev) => {
  const targetItem = ev.target.parentElement.parentElement;
  const checkBox = "todo-item__checkbox";
  let clickedEl = ev.target.closest(`.${checkBox}`);

  if (ev.target.tagName === "I") {
    UI.todoInput.value =
      targetItem.querySelector(".todo-item__text").textContent;
    UI.formBtn.textContent = "Save";
    UI.formBtn.id = targetItem.id;
  }

  if (ev.target.tagName === "IMG") {
    deleteLocalStorage(targetItem.id);
    targetItem.remove();
  }

  if (!clickedEl) return;
  const taskClicked = clickedEl.closest(".todo-item");

  if (clickedEl.classList.contains(checkBox)) {
    if (!clickedEl.hasAttribute("checked")) {
      taskClicked.classList.add("done");
      taskClicked.dataset.complete = "true";
      clickedEl.setAttribute("checked", "");

      data = data.map((task) => {
        if (task.id === Number(taskClicked.id)) {
          return {
            id: task.id,
            desc: task.desc,
            isCompleted: "true",
          };
        } else return task;
      });
    } else {
      taskClicked.classList.remove("done");
      taskClicked.dataset.complete = "false";
      clickedEl.removeAttribute("checked");

      data = data.map((task) => {
        if (task.id === Number(taskClicked.id)) {
          return {
            id: task.id,
            desc: task.desc,
            isCompleted: "false",
          };
        } else return task;
      });
    }
  }

  displayTasksCount();
});

const deleteLocalStorage = (id) => {
  data = data.filter((item) => {
    return item.id !== Number(id);
  });

  localStorage.setItem("tasksData", JSON.stringify(data));
};

const editLocalStorage = (id, editContent) => {
  console.log(id, editContent);
  data = data.map((item) => {
    if (item.id === Number(id)) {
      item.desc = editContent;
    }
    return item;
  });
  localStorage.setItem("tasksData", JSON.stringify(data));
  renderUI();
};

UI.allBtn.addEventListener("click", (ev) => {
  UI.filterBtns.forEach((btn) => {
    btn.classList.remove("active");
  });

  ev.target.classList.add("active");
  UI.todoItemsContainer.innerHTML = "";

  if (data.length === 0) {
    UI.todoItemsContainer.innerHTML = `<li class="message">Tasks list is empty!</li>`;
  }
  data.forEach((task) => {
    const markup = generateTaskMarkup(task.id, task.desc, task.isCompleted);
    UI.todoItemsContainer.insertAdjacentHTML("beforeend", markup);
  });
});

UI.activeBtn.addEventListener("click", (ev) => {
  let incompletedTasks = data.filter((task) => {
    return task.isCompleted === "false";
  });

  UI.filterBtns.forEach((btn) => {
    btn.classList.remove("active");
  });

  ev.target.classList.add("active");

  UI.todoItemsContainer.innerHTML = "";
  if (incompletedTasks.length === 0) {
    UI.todoItemsContainer.innerHTML = `<li class="message">Tasks list is empty!</li>`;
  }
  incompletedTasks.forEach((task) => {
    const markup = generateTaskMarkup(task.id, task.desc, task.isCompleted);
    UI.todoItemsContainer.insertAdjacentHTML("beforeend", markup);
  });
});

UI.completedBtn.addEventListener("click", (ev) => {
  let completedTasks = data.filter((task) => {
    return task.isCompleted === "true";
  });

  UI.filterBtns.forEach((btn) => {
    btn.classList.remove("active");
  });
  ev.target.classList.add("active");
  UI.todoItemsContainer.innerHTML = "";
  if (completedTasks.length === 0) {
    UI.todoItemsContainer.innerHTML = `<li class="message">Tasks list is empty!</li>`;
  }
  completedTasks.forEach((task) => {
    const markup = generateTaskMarkup(task.id, task.desc, task.isCompleted);
    UI.todoItemsContainer.insertAdjacentHTML("beforeend", markup);
  });
});

UI.clearCompletedBtn.addEventListener("click", () => {
  const completedTasks = data.filter((task) => task.isCompleted === "true");

  completedTasks.forEach((completedTask) => {
    console.log(completedTask);
    UI.todoItemsContainer.removeChild(
      document.getElementById(completedTask.id)
    );
  });

  if (!UI.todoItemsContainer.children.length)
    UI.todoItemsContainer.innerHTML = `<li class="message">Tasks list is empty!</li>`;

  data = data.filter((task) => task.isCompleted === "false");
  storeTasks();
});

UI.allBtn.addEventListener("click", (ev) => {
  UI.filterBtns.forEach((btn) => {
    btn.classList.remove("active");
  });

  ev.target.classList.add("active");
  UI.todoItemsContainer.innerHTML = "";

  if (data.length === 0) {
    UI.todoItemsContainer.innerHTML = `<li class="message">Tasks list is empty!</li>`;
  }
  data.forEach((task) => {
    const markup = generateTaskMarkup(task.id, task.desc, task.isCompleted);
    UI.todoItemsContainer.insertAdjacentHTML("beforeend", markup);
  });
});
