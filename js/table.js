'use strict'

// Создание таблицы и весь присущий ей функционал помещён в класс
class Table {
  constructor() {
    //Исходные данные
    this.data = [];
    //Данные, требуемые в нашей таблице
    this.virtualTable = [];
    //чек-лист нужен для метода filterData
    this.checkList = ['firstName', 'lastName', 'about', 'eyeColor'];
    this.titles = ['Имя', 'Фамилия', 'Описание', 'Цвет глаз'];
    
    //При создании экземляра класса сразу же получаем исходные данные
    this.getData();
  }


  //Метод для получения данных из JSON
  async getData() {
    //Делаем запрос данных на локальный сервер (в нашем случае)
    const req = await fetch("./accounts.json");
    const arr = await req.json();
    this.data = arr;
    this.virtualTable = arr.map( (person) => this.filterData(person) );
    
    //Создаём таблицу на основе отфильтрованных данных
    this.render();
  }


  //Пропускаем исходные данные через фильтр, чтобы получить только необходимое для таблицы
  filterData(person) {
    let properties = [];

    for (let key in person) {

      if (typeof(person[key]) != 'string') {
        //Вызываем фильтр повторно, чтобы парсить многоуровневые объекты
        let list = this.filterData(person[key]);

        for (let item of list) properties.push(item); 
      }
      //Подходящие данные добавляются в массив
      if (this.checkList.includes(key)) {
        properties.push(person[key]);
      }
    }
    //Получаем на выходе список нужных значений
    return properties;
  }




  //Метод для создания таблицы
  render() {
    
    const table = document.createElement('table');
    table.className = 'tbl';

    //Вызываем методы для создания заголовков и тела таблицы
    table.append(this.renderTitles());
    table.append(this.renderFields());
    
    //Добавляем таблицу в HTML-код
    document.body.append(table);

    //Добавляем возможность скрытия и показа колонок таблицы
    this.setShowHideMode();

    //Добавляем возможность редактирования строк таблицы
    this.setChangeButtons();
    
  }

  //Метод создания заголовков
  renderTitles() {
    //Счётчик следит за порядковым номером создаваемого заголовка, чтобы назначить нужный класс
    let count = 0;

    let caption = document.createElement('thead');
    let captionRow = document.createElement('tr');
    
    //Цикл кладёт в captionRow названия колонок
    for (let title of this.titles) {

      let column = document.createElement('th');

      column.textContent = title;
      column.setAttribute('class', `column_${count++}`);

      //Каждый заголовок слушает событие "клик" и вызывает сортировку
      column.addEventListener('click', this.sort);
      captionRow.append(column);
    }
    caption.append(captionRow);

    //Возвращаем готовый thead нашей таблицы в render
    return caption;
  }

  //Метод для создания тела таблицы
  renderFields() {
    
    let tableBody = document.createElement('tbody');

    //Данный счётчик следит за индексом элементов в перебираемом массиве this.virtualTable
    let countPerson = 0;
    
    //Создаём строку и назначаем ей соответствующий id из массива this.data
    for (let person of this.virtualTable) {

      let row = document.createElement('tr');
      row.id = this.data[countPerson++].id;

      //В случае события "mouseover" строка показывает сбоку кнопку "редактировать"
      row.addEventListener('mouseover', (event) => this.showChangeButton(event.currentTarget.id));
      //В случае события "mouseout" строка скрывает сбоку кнопку "редактировать"
      row.addEventListener('mouseout', (event) => this.hideChangeButton(event.currentTarget.id));

      //Счётчик следит, в какой колонке создаётся ячейка таблицы
      let countColumn = 0;

      //Цикл создаёт ячейки в строке и назначает каждой класс в соответствии с номером порядковым колонки
      for (let property of person) {
        if (countColumn == 3) {
          //В ячейках колонки "цвет глаз" задаём стили для показа цвета вместо текста
          row.innerHTML += `<td class = 'column_${countColumn++}' style = 'background-color: ${property}; color: ${property}'><span>${property}</span></td>`;
        } else{
        row.innerHTML += `<td class = 'column_${countColumn++}'><span>${property}</span></td>`;
        }

        tableBody.append(row);
      }
    } 
    //Готовый tbody возвращаем в render
    return tableBody;
  }


  //Метод для создания меню для показа и скрытия колонок
  setShowHideMode() {
    const switcher = document.createElement('div');
    switcher.id = 'switcher'
    switcher.textContent = 'Показать/Скрыть:'

    //Счётчик следит за порядковым номером колонки, для которой созаётся checkbox
    let countColumn = 0

    //Цикл создаёт checkbox, которые привязываются к колонкам таблицы с помощью data-column-class
    for (let title of this.titles) {

      switcher.innerHTML += `<p>${title}<input type="checkbox" data-column-class="column_${countColumn++}" checked></p>`
    }
    //Меню слушает событие change в своих checkbox и вызывает метод для скрытия или показа колонок таблицы
    switcher.addEventListener('change', event => {
      this.toggleColumn(event.target.dataset.columnClass);
    });

    document.body.prepend(switcher);
  }

  //Метод для скрытия или показа колонок таблицы
  toggleColumn(columnClass) {

    //Нахождение всех ячеек с определённой колонки таблицы
    const cells = document.querySelectorAll(`.${columnClass}`);

    //Назначние или удаление класса hidden 
    cells.forEach( (cell) => {
      cell.classList.toggle('hidden');
    });
  }
  

  //Метод для сортировки по выбранной колонке таблицы
  sort(event) {
    //Определяем класс выбранной колонки и берём из класса её порядковый номер
    let triggedColumn = event.currentTarget.getAttribute('class');
    triggedColumn = triggedColumn[triggedColumn.length - 1];

    //Находим нашу таблицу
    const table = document.querySelector('table.tbl');

    //Выбираем из таблицы все ряды кроме первого
    let sortedRows = Array.from(table.rows)
    .slice(1)
    //Сортируем по выбранной колонке
    .sort((rowA, rowB) => rowA.cells[triggedColumn].textContent > rowB.cells[triggedColumn].textContent ? 1 : -1);

    //Переставляем все строки в таблице согласно результатам сортировки
    table.tBodies[0].append(...sortedRows);
  }


  //Метод для создания кнопок для редактирования
  setChangeButtons() {

    //Находим нашу таблицу
    const table = document.querySelector('table.tbl');

    //Выбираем из таблицы все ряды кроме первого
    let rows = Array.from(table.rows).slice(1);
  
    //Данный счётчик следит за индексом элементов в массиве this.data
    let countPerson = 0;
    
    //Цикл создаёт кнопку редактирования для каждой строки
    for (let row of rows) {

      let changeButton = document.createElement('a');

      changeButton.href = '#';
      changeButton.textContent = 'Редактировать';

      //Для назначения стилей
      changeButton.setAttribute('class', 'changeButton');

      //Для методов showChangeButton и hideChangeButton
      changeButton.setAttribute('data-buttonid',`${this.data[countPerson++].id}`);

      //При клике открывает форму для редактирования выбранной строки
      changeButton.addEventListener('click', (event) => this.openChangeElementForm(event.currentTarget.dataset.buttonid));
  
      row.append(changeButton);
      }
  
    document.body.append(table);
    
  }
  //Метод для показа кнопок редактирования
  showChangeButton (id) {
    const buttons = document.querySelectorAll('a');
    const currentButton = Array.from(buttons).find( button => button.dataset.buttonid == id);
    currentButton.style.opacity = '100%';
  }
  //Метод для скрытия кнопок редактирования
  hideChangeButton (id) {
    const buttons = document.querySelectorAll('a');
    const currentButton = Array.from(buttons).find( button => button.dataset.buttonid == id);
    currentButton.style.opacity = '0';
  }


  //Метод для динамического создания формы редактирования строки в таблице
  openChangeElementForm(id){

    const form = document.createElement('form');
    form.setAttribute('class', 'сhangeform');

    //Считает создаваемые textarea в форме
    let countTextarea = 0;

    //Находим выбранную пользователем строку
    const row = document.getElementById(`${id}`);

    //Цикл назначает для каждой ячейки выбранной строки свою textarea и сразу заполняет её исходной информацией
    for (let cell of row.cells) {

      let title = document.createElement('p');
      title.innerHTML = `${this.titles[countTextarea++]}<br>`;

      let textArea = document.createElement('textarea');
      textArea.value = cell.textContent;
      textArea.rows = 2;

      title.append(textArea);

      form.append(title);
    }

    //Панель для управления формой
    const controlPanel = document.createElement('div')


    //создание кнопки "Сохранить"
    const saveButton = document.createElement('a');
    saveButton.href = '#';
    saveButton.textContent = 'сохранить';

    //Связываем кнопку с id выбранной строки
    saveButton.setAttribute('data-formid', `${id}`);

    //При клике вызывает getNewData и передаё ей id редактируемой строки
    saveButton.addEventListener('click', (event) => this.getNewData(event.currentTarget.dataset.formid));
    controlPanel.append(saveButton);



    //создание кнопки "Отменить"
    const cancelButton = document.createElement('a');
    cancelButton.href = '#';
    cancelButton.textContent = 'отменить';

    //При клике вызывает closeChangeElementForm, чтобы закрыть форму
    cancelButton.addEventListener('click', this.closeChangeElementForm);
    controlPanel.append(cancelButton);

    form.append(controlPanel);
    document.body.append(form);
  }


  //Метод для создания массива из отредактированных пользователем данных
  getNewData(id) {

    //Находим все заполненные пользователем textarea
    const textAreaList = document.querySelectorAll('textarea');

    let arrOfValues = [];

    //Заполняем массив
    for (let textArea of textAreaList) {
      arrOfValues.push(textArea.value);
    }

    //Передаём массив и id редактируемой строки в saveNewData
    this.saveNewData(arrOfValues, id);
  }


  //Метод для сохранения новых данных в редактирумой строке
  saveNewData(arrOfValues, id) {

    //Находим по id редактируемую строку
    const row = document.getElementById(`${id}`);
    
    //Счётчик следит за порядковым номером колонки
    let queue = 0;
    
    //Заменяем данные в ячейках таблицы
    for (let cell of row.cells) {

      
      if (cell.getAttribute('class') == 'column_3') {
        cell.innerHTML = `<span>${arrOfValues[queue]}</span>`;

        //Для ячейки колонки "цвет глаз" переназначаем стили согласно введённым данным
        cell.style.backgroundColor = arrOfValues[queue];
        cell.style.color = arrOfValues[queue];
      } else {
        cell.innerHTML = `<span>${arrOfValues[queue++]}</span>`;
      }
    }

    //Закрываем форму редактирования
    this.closeChangeElementForm(); 
    
  }
    
  //Метод для закрытия формы редактирования
  closeChangeElementForm() {
    const form = document.querySelector('form');
    form.remove();
  }
}

//Создаём таблицу
const table = new Table();

