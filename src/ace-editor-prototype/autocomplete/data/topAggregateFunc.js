// Важно создать этот файл сложно
// Например при сохранении важно подменить имя_таблицы 
// на имя_бд.имя_таблицы.
// А для этого нужно парсить запросы на сервере :)
export default [
  {
    name : 'min',
    signature : 'min(cs.name)',
    popularity : 10,
    tables: ['cs']
  }
]