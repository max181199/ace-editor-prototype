import * as ace from 'ace-builds';
import hiveAutocompleteParser from '../parser/HiveSyntaxParser'
import tables from '../data/table.json'
import functions from '../data/function'
import joins from '../data/joins.json';
import aggregateFunctions from '../data/topAggregateFunc'
import groupbys from '../data/groupbys';
import orderbys from '../data/orderbys';
import filtres from '../data/filters'

let AceRange =  ace.require('ace/range').Range;

const getTextBeforeCursor = (editor,isDelete) => {
  if (!isDelete){
    let left = new AceRange(0, 0, editor.getCursorPosition().row, editor.getCursorPosition().column + 1);
    return editor.session.getTextRange(left);
  } else {
    let left = new AceRange(0, 0, editor.getCursorPosition().row, editor.getCursorPosition().column);
    return editor.session.getTextRange(left);
  }
}

const getTextAfterCursor = (editor,isDelete) => {
  if (!isDelete){
    let right = new AceRange(editor.getCursorPosition().row, editor.getCursorPosition().column + 1, editor.session.getLength(), editor.session.getRowLength(editor.session.getLength()));
    return editor.session.getTextRange(right);
  } else {
    let right = new AceRange(editor.getCursorPosition().row, editor.getCursorPosition().column, editor.session.getLength(), editor.session.getRowLength(editor.session.getLength()));
    return editor.session.getTextRange(right);
  }
}

const getSuggests = (editor,isDelete) => {

  let suggests = {};
  let parser_result = hiveAutocompleteParser.parseSql(
    getTextBeforeCursor(editor,isDelete),
    getTextAfterCursor(editor,isDelete),
    null
  )
  //console.log("TEST:::",isDelete,editor.getCursorPosition().row, editor.getCursorPosition().column,getTextBeforeCursor(editor,isDelete),'_||_',getTextAfterCursor(editor,isDelete));
  //console.log('parser_result ::: ',parser_result)
  // 0. UDF (User-Defined Functions)
    // TO-DO
  // 1. KEYWORDS
    // Список подходящих по контексту ключевых слов
    // 
  if (parser_result.suggestKeywords) {
    suggests.isKeywords = true;
    suggests.keywords = parser_result.suggestKeywords.map(keyword=>{
      return {
        value : parser_result.lowerCase ? keyword.value.toLowerCase() : keyword.value,
        meta: 'keyword', 
        category: 'KEYWORD',
        weightAdjust: keyword.weight,
        popular: false, // TODO в будущем можно анализировать популярность ключевых слов.
        details: null
      }
    });
  } else {
    suggests.isKeywords = false;
  }
  // 2. SNIPPETS
    //  Hue не использует снипеты,
    //  взамен hue использует историю запрсов.
  // 3. ColRefKeyword
    // Под ColRef понимается предложения операции на основе типа столбца
    // в булевском предикате ( например Where ) 
    // достаточно ненадежно, например если обернуть выражение со столбцом в скобки
    // Работать не будет. 
  if (parser_result.suggestColRefKeywords){
    suggests.isSuggestColRefKeywords = true;
    // !!! Предположительно пользователь не работает с БД (схемами)
    // Именно поэтому в выражении A.B.C.D.E...
    // A - таблица, B - столбец
    let tableName = '';
    let columnName = '';
    if ( parser_result.colRef.identifierChain.length == 2 ){
      tableName = parser_result.colRef.identifierChain[0].name;
      columnName = parser_result.colRef.identifierChain[1].name;
    }
    let columnType = undefined;
    tables.commonTables.forEach(table=>{
      if (table.tableName == tableName) table.columns.forEach(column=>{
        if (column.columnName == columnName) {
          columnType = column.columnType
        }
      })
    })
    if (!columnType){
      tables.userTables.forEach(table=>{
        if (table.tableName == tableName) table.columns.forEach(column=>{
          if (column.columnName == columnName){
            columnType = column.columnType
          } 
        })
      })
    }
    if (!columnType){
      suggests.isSuggestColRefKeywords = false;
    } else {
      if (parser_result.suggestColRefKeywords[columnType]){
        suggests.suggestColRefKeywords = parser_result.suggestColRefKeywords[columnType.toUpperCase()].map((val)=>{
          return {
            value : val.toLowerCase(),
            meta: 'colRefKeyword', 
            category: 'COL_REF_KEYWORD',
            weightAdjust: 10,
            popular: false, // TODO в будущем можно анализировать популярность 
            details: {
              type : columnType
            }
          }
        })
      } else {
        suggests.isSuggestColRefKeywords = false;
      }
    }
  } else {
    suggests.isSuggestColRefKeywords = false;
  }
  // 4. IDENTIFIERS
    // У идентификаторов будет самый малый вес при автодополнении.
    if ( parser_result.suggestIdentifiers){
      suggests.isSuggestIdentifiers = true;
      suggests.suggestIdentifiers = parser_result.suggestIdentifiers.map((identifier)=>{
        return {
          value : identifier.name.toLowerCase(),
          meta: identifier.type, 
          category: 'IDENTIFIERS',
          weightAdjust: 9,
          popular: false, // TODO в будущем можно анализировать популярность
          details: null
        }
      });
    } else {
      suggests.isSuggestIdentifiers = false;
    }
    // 5. COLUMN ALIESES
      //  Используется например в ORDER BY
    if (parser_result.suggestColumnAliases){
      suggests.isSuggestColumnAliases = true;
      suggests.suggestColumnAliases = [];
      for (const columnAlias of parser_result.suggestColumnAliases) {
        const type = columnAlias.types && columnAlias.types.length === 1 
        ? 
        columnAlias.types[0] 
        : 
        'T';
        // Что такое ALIAS не ясно.
        if (type === 'COLREF') {
          suggests.suggestColumnAliases.push({
            value: columnAlias.name,
            meta: 'ALIAS',
            weightAdjust: 10,
            category: 'COLUMN',
            popular: false,
            details: null
          });
        } else if (type === 'UDFREF') {
          //  UDFREF ::: AS ссылка на столбец.
          try {
            // Достаточно слабое место, поскольку нельзя определить наименование
            // таблицы, поэтому в HUE предлагают один из доступных типов
            // кажется удобнее предлагать meta udfref и раскрашивать из
            // в специальные цвета
            suggests.suggestColumnAliases.push({
              value: columnAlias.name,
              meta: 'UDFREF',
              weightAdjust: 10,
              category: 'COLUMN',
              popular: false,
              details: columnAlias
            });
          } catch (err) {}
        } else {
          suggests.suggestColumnAliases.push({
            value: columnAlias.name,
            meta: type.toUpperCase(), 
            weightAdjust: 10,
            category: 'COLUMN',
            popular: false,
            details: columnAlias
          });
        }
      }
    } else {
      suggests.isSuggestColumnAliases = false;
    }
    // 6. COMMON_TABLE_EXPRESSIONS
      // SUGGEST AFTER FROM WITH;
    if (parser_result.suggestCommonTableExpressions){
      suggests.isSuggestCommonTableExpressions = true;
      suggests.suggestCommonTableExpressions = [];
      parser_result.suggestCommonTableExpressions.forEach(expression => {
        let meta = []
        let prefix = expression.prependQuestionMark ? '? ' : '';
        meta.push(prefix)
        if (expression.prependFrom) {
          prefix += parser_result.lowerCase ? 'from ' : 'FROM ';
          meta.push(parser_result.lowerCase ? 'from ' : 'FROM ')
        } else meta.push('')
        meta.push(expression.name)
        suggests.suggestCommonTableExpressions.push({
          value: prefix + expression.name,
          weightAdjust: 6,
          meta: meta,
          category: 'COMMON_TABLE_EXPRESSIONS',
          popular: false,
          details: null
        });
      });
    } else {
      suggests.isSuggestCommonTableExpressions = false;
    }
    // 7. OPTIONS
      // Только для IMPALA
    // 8. FUNCTIONS
      // 
    if (parser_result.suggestFunctions){
      suggests.isSuggestFunctions = true
      suggests.suggestFunctions = []
      const suggestFunctions = parser_result.suggestFunctions;
      if (  
        suggestFunctions.types &&
        (
          suggestFunctions.types[0] === 'COLREF' ||
          suggestFunctions.types[0] === 'UDFREF'
        ) 
      ){
        // Идея ::: на основе анализа ColRef получаем типы 
        // столбцов и предлагаем только функции, которые
        // возвращают подходящий результат. 
        // Забавно, но в Hue не работает, ошибка в коде :)
        let types = ['T'];
        // Получение типов столбцов.
        if (parser_result.colRef && parser_result.colRef.identifierChain.length == 2){
          tables.commonTables.forEach(table => {
            if (table.tableName == parser_result.colRef.identifierChain[0].name ){
              table.columns.forEach(column => {
                if (column.columnName == parser_result.colRef.identifierChain[1].name){
                  types.push(column.columnType.toUpperCase())
                }
              })
            }
          })
          tables.userTables.forEach(table => {
            if (table.tableName == parser_result.colRef.identifierChain[0].name ){
              table.columns.forEach(column => {
                if (column.columnName == parser_result.colRef.identifierChain[1].name){
                  types.push(column.columnType.toUpperCase())
                }
              })
            }
          })
        }
        // Подбор функции под типы
        if (suggestFunctions.types[0] === 'COLREF'){
          suggests.suggestFunctions = functions.reduce((res,cur)=>{
            if ( 
                (!cur.isAnalytic && !cur.isAggregate) ||
                (parser_result.suggestAggregateFunctions && cur.isAggregate) ||
                (parser_result.suggestAnalyticFunctions  && cur.isAnalytic)
               ){
                return [...res,...cur.functions.filter(func=>{
                  return types.some(el=>el==func.returnTypes[0])
                }).map((func)=>{
                  return {...func, type : cur.name}
                })]
            }  else return res;
          },[]).map((func)=>{
            return {
              value: func.name + '()',
              meta: func, 
              weightAdjust: func.type == 'Aggregate' || func.type == 'Analytic' ? 5 : 4,
              category: 'FUNCTION',
              popular: false,
              details: func
            }
          });
        } else {
          // Здесь можно добавить функции определенные пользователем.
        }
      } else {
        const types = suggestFunctions.types || ['T'];
        suggests.suggestFunctions = functions.reduce((res,cur)=>{
          if ( 
              (!cur.isAnalytic && !cur.isAggregate) ||
              (parser_result.suggestAggregateFunctions && cur.isAggregate) ||
              (parser_result.suggestAnalyticFunctions  && cur.isAnalytic)
             ){
              return [...res,...cur.functions.filter(func=>{
                return types.some(el=>el==func.returnTypes[0])
              }).map((func)=>{
                return {...func, type : cur.name}
              })]
          }  else return res;
        },[]).map((func)=>{
          return {
            value: func.name + '()',
            meta: func, 
            weightAdjust: func.type == 'Aggregate' || func.type == 'Analytic' ? 5 : 4,
            category: 'FUNCTION',
            popular: false,
            details: func
          }
        });
      }
    } else {
      suggests.isSuggestFunctions = false
    }
    // 9. DATABASES.
      // Предположительно у нас нет БД, есть только
      // Таблицы и столбцы
    // 10. TABLES
    if (parser_result.suggestTables){
      suggests.isSuggestTables = true;
      suggests.suggestTables = [];
      let formula = [];
      const suggestTables = parser_result.suggestTables;
      let prefix = suggestTables.prependQuestionMark ? '? ' : '';
      formula.push(prefix);
      if (suggestTables.prependFrom) {
        prefix += parser_result.lowerCase ? 'from ' : 'FROM ';
        formula=[...formula,parser_result.lowerCase ? 'from ' : 'FROM ']
      } else {
        formula=[...formula,'']
      }
      tables.commonTables.forEach((table)=>{
        suggests.suggestTables.push({
          value: prefix + table.tableName,
          meta: [...formula,table.tableName],
          weightAdjust: 8,
          category: 'TABLE',
          popular: table.popularity,
          details: table
        })
      })
      tables.userTables.forEach((table)=>{
        suggests.suggestTables.push({
          value: prefix + table.tableName,
          meta: [...formula,table.tableName], 
          weightAdjust: 7,
          category: 'TABLE',
          popular: table.popularity,
          details: table
        })
      })
    } else {
      suggests.isSuggestTables = false;
    }
    // 11. COLUMNS
    // Вспомогательные функции :::
    // equalIgnoreCase
    const equalIgnoreCase = (a, b) => {
      return !!a && !!b && a.toLowerCase() === b.toLowerCase();
    }
    // addCteColumns
    const addCteColumns = (table) => {
      let columnSuggestions = []
      const cte = parser_result.commonTableExpressions.find(cte =>{
        return(equalIgnoreCase(cte.alias,table.identifierChain[0].cte))
      });
      if (!cte) {
        return;
      }
      for (const column of cte.columns) {
        const type =
          typeof column.type !== 'undefined' && column.type !== 'COLREF' ? column.type : 'T';
        if (typeof column.alias !== 'undefined') {
          columnSuggestions.push({
            value: column.alias,
            meta: type,
            table: table,
            weightAdjust: 11,
            category: "COLUMN",
            popular: false,
            details: column
          });
        } else if (
          typeof column.identifierChain !== 'undefined' &&
          column.identifierChain.length > 0 &&
          typeof column.identifierChain[column.identifierChain.length - 1].name !== 'undefined'
        ) {
          columnSuggestions.push({
            value: column.identifierChain[column.identifierChain.length - 1].name,
            meta: type,
            table: table,
            weightAdjust: 11,
            category: "COLUMN",
            popular: false,
            details: column
          });
        }
      }
      return columnSuggestions
    }
    // locateSubQuery
    const locateSubQuery =  (subQueries, subQueryName) => {
      if (typeof subQueries === 'undefined') {
        return null;
      }
      const foundSubQueries = subQueries.filter(knownSubQuery => {
        return equalIgnoreCase(knownSubQuery.alias, subQueryName);
      });
      if (foundSubQueries.length > 0) {
        return foundSubQueries[0];
      }
      return null;
    };
    // addSubQueryColumns
    const addSubQueryColumns = (table) => {
      let columnSuggestions = []
      const foundSubQuery = locateSubQuery(
        parser_result.subQueries,
        table.identifierChain[0].subQuery
      );
      const addSubQueryColumnsRecursive =  subQueryColumns => {
        for (const column of subQueryColumns) {
          if (column.alias || column.identifierChain) {
            // TODO: Potentially fetch column types for sub-queries, possible performance hit.
            const type =
              typeof column.type !== 'undefined' && column.type !== 'COLREF' ? column.type : 'T';
            if (column.alias) {
              columnSuggestions.push({
                value: column.alias,
                meta: type,
                table: table,
                weightAdjust: 11,
                category: "COLUMN",
                popular: false,
                details: column
              });
            } else if (column.identifierChain && column.identifierChain.length > 0) {
              columnSuggestions.push({
                value: column.identifierChain[column.identifierChain.length - 1].name,
                meta: type,
                table: table,
                weightAdjust: 11,
                category: "COLUMN",
                popular: false,
                details: column
              });
            }
          } else if (column.subQuery && foundSubQuery.subQueries) {
            const foundNestedSubQuery = locateSubQuery(foundSubQuery.subQueries, column.subQuery);
            if (foundNestedSubQuery !== null) {
              addSubQueryColumnsRecursive(foundNestedSubQuery.columns);
            }
          }
        }
      };
      if (foundSubQuery !== null && foundSubQuery.columns.length > 0) {
        addSubQueryColumnsRecursive(foundSubQuery.columns);
      }
      return columnSuggestions;
    }
    // addColumn
    const addColumns = (table, types) => {
      const columnSuggestions = []
      if (
        typeof table.identifierChain !== 'undefined' &&
        table.identifierChain.length === 1 &&
        typeof table.identifierChain[0].cte !== 'undefined'
      ) {
        if (
          typeof this.parseResult.commonTableExpressions !== 'undefined' &&
          this.parseResult.commonTableExpressions.length > 0
        ) {
          columnSuggestions = [...columnSuggestions, ...addCteColumns(table)] 
        }
      } else if (
        typeof table.identifierChain !== 'undefined' &&
        table.identifierChain.length === 1 &&
        typeof table.identifierChain[0].subQuery !== 'undefined'
      ) {
        columnSuggestions = [...columnSuggestions, ...addSubQueryColumns(table)]
      } else if (typeof table.identifierChain !== 'undefined') {
        const addColumnsFromEntry =  columns => {
          columns.forEach((column)=>{
            columnSuggestions.push({
              value: column.columnName,
              meta: column.columnType,
              category: 'COLUMN',
              popular: column.popularity,
              table: table,
              weightAdjust:
                types[0].toUpperCase() !== 'T' &&
                types.some(type => equalIgnoreCase(type, column.columnType))
                  ? 12
                  : 11,
              details: column
            });
          })
        };
        const suggestcolumns = parser_result.suggestColumns ;
        const identifierChain =
          (suggestcolumns && suggestcolumns.identifierChain) || table.identifierChain;
        try {
         // indetifierChain содержит имя таблицы,
         // Поэтому entry будет списком столбцов подходящей таблицы.
         let entry = undefined;
         tables.commonTables.forEach(table=>{
           if (table.tableName == identifierChain[0].name){
              entry = table.columns;
           }
         })
         tables.userTables.forEach(table=>{
          if (table.tableName == identifierChain[0].name){
             entry = table.columns;
          }
        })
          if (entry) {
            addColumnsFromEntry(entry);
          }
        } catch (err) {}
      }
      return columnSuggestions;
    }
    // mergeColumns
    const mergeColumns = (columnSuggestions) => {
      columnSuggestions.sort((a, b) => a.value.localeCompare(b.value));
  
      for (let i = 0; i < columnSuggestions.length; i++) {
        const suggestion = columnSuggestions[i];
        suggestion.isColumn = true;
        let hasDuplicates = false;
        for (
          i;
          i + 1 < columnSuggestions.length && columnSuggestions[i + 1].value === suggestion.value;
          i++
        ) {
          const nextTable = columnSuggestions[i + 1].table;
          if (typeof nextTable.alias !== 'undefined') {
            columnSuggestions[i + 1].value = nextTable.alias + '.' + columnSuggestions[i + 1].value;
          } else if (
            typeof nextTable.identifierChain !== 'undefined' &&
            nextTable.identifierChain.length > 0
          ) {
            const previousIdentifier =
              nextTable.identifierChain[nextTable.identifierChain.length - 1];
            if (typeof previousIdentifier.name !== 'undefined') {
              columnSuggestions[i + 1].value =
                previousIdentifier.name + '.' + columnSuggestions[i + 1].value;
            } else if (typeof previousIdentifier.subQuery !== 'undefined') {
              columnSuggestions[i + 1].value =
                previousIdentifier.subQuery + '.' + columnSuggestions[i + 1].value;
            }
          }
          hasDuplicates = true;
        }
        if (typeof suggestion.table.alias !== 'undefined') {
          suggestion.value = suggestion.table.alias + '.' + suggestion.value;
        } else if (
          hasDuplicates &&
          typeof suggestion.table.identifierChain !== 'undefined' &&
          suggestion.table.identifierChain.length > 0
        ) {
          const lastIdentifier =
            suggestion.table.identifierChain[suggestion.table.identifierChain.length - 1];
          if (typeof lastIdentifier.name !== 'undefined') {
            suggestion.value = lastIdentifier.name + '.' + suggestion.value;
          } else if (typeof lastIdentifier.subQuery !== 'undefined') {
            suggestion.value = lastIdentifier.subQuery + '.' + suggestion.value;
          }
        }
      }
      return columnSuggestions
    }
    // Основная функция
    if (parser_result.suggestColumns){
      suggests.isSuggestColumns = true
      suggests.suggestColumns = [];
      let suggestColumns = parser_result.suggestColumns;
      let types = ['T'];
      if (suggestColumns.types && suggestColumns.types[0] === 'COLREF') {
        if (parser_result.colRef.identifierChain.length == 2){
          tables.commonTables.forEach(table => {
            if (table.tableName == parser_result.colRef.identifierChain[0].name ){
              table.columns.forEach(column => {
                if (column.columnName == parser_result.colRef.identifierChain[1].name){
                  types.push(column.columnType.toUpperCase())
                }
              })
            }
          })
          tables.userTables.forEach(table => {
            if (table.tableName == parser_result.colRef.identifierChain[0].name ){
              table.columns.forEach(column => {
                if (column.columnName == parser_result.colRef.identifierChain[1].name){
                  types.push(column.columnType.toUpperCase())
                }
              })
            }
          })
        }
      } else if (suggestColumns.types && suggestColumns.types[0] === 'UDFREF'){
        // <<< UDFREF <---> UDFREF >>> \\
      }
      // !!!Заплатка suggestColumns не содержит tables (как правило)
      // Однако suggestAggregateFunctions содержит 
      // Поэтому скопируем оттуда.
      let localTables = suggestColumns.tables || parser_result.suggestAggregateFunctions.tables;
      localTables.forEach(table => {
        suggests.suggestColumns = [...suggests.suggestColumns,...addColumns(table,types)]
      });
      suggests.suggestColumns = mergeColumns(suggests.suggestColumns)
    } else {
      suggests.isSuggestColumns = false
    }
  // В будущем требуется отладка.
  // 12. VALUES
  // Основная функция
  if (parser_result.suggestValues){
    suggests.isSuggestValues = true
    suggests.suggestValues = []
    const colRefResult = parser_result.colRef;
    const suggestValues = parser_result.suggestValues;
    if (colRefResult && colRefResult.identifierChain) {
      suggests.suggestValues.push({
        value:
          '${' + colRefResult.identifierChain[colRefResult.identifierChain.length - 1].name + '}',
        weightAdjust: 7,
        meta: '',
        category: 'VARIABLE',
        popular: false,
        details: null
      });
    }
    // Видел только пример сэмплов для Impala
    // Постмотреть на результат автодополнения
    // Возможно стоит добавить
    // let colRef = getSamples();
    // if (colRef.sample) {
    //   const isString = colRef.type === 'string';
    //   const startQuote = suggestValues.partialQuote ? '' : "'";
    //   const endQuote =
    //     typeof suggestValues.missingEndQuote !== 'undefined' &&
    //     suggestValues.missingEndQuote === false
    //       ? ''
    //       : suggestValues.partialQuote || "'";
    //   colRef.sample.forEach(sample => {
    //     suggests.suggestValues.push({
    //       value: isString ? startQuote + sample + endQuote : String(sample),
    //       meta: '',
    //       weightAdjust: 3,
    //       category: 'SAMPLE',
    //       popular: false,
    //       details: null
    //     });
    //   });
    // }
  } {
    suggests.isSuggestValues = false
  }
  // 13. PATH 
  // Не нужно
  // 14. JOINS
  // Вспомогательная функция
  // tableIdentifierChainsToPaths
  const tableIdentifierChainsToPaths = (tb) => {
    let paths = [];
    tb.forEach(t => {
      // Could be subquery
      const isTable = t.identifierChain.every(identifier => {
        return typeof identifier.name !== 'undefined';
      });
      if (isTable) {
        const path = t.identifierChain.map(identifier => {
          return identifier.name;
        });
        if (path.length === 1) {
          // У нас таблица может принадлежать либо common_table
          // Либо user_table, необходимо определить название БД
          // Если таблица ничему не принадлежит то undefine
          let db = ''
          let common_table = tables.commonTables.some(table => {
            if (table.tableName === path[0]){db = table.databaseName}
            return table.tableName === path[0]
          })
          let user_table = tables.userTables.some(table => {
            if (table.tableName === path[0]){db = table.databaseName}
            return table.tableName === path[0]
          })
          let res = common_table ? db : user_table ? db : undefined;
          path.unshift(res);
        }
        paths.push(path);
      }
    });
    return paths;
  }
  // Основная функция
  // suggestJoins предлагает topJoin
  // для этого должны анализироваться выполненные запросы пользователя.
  if (parser_result.suggestJoins){
    suggests.isSuggestJoins = true;
    const suggestJoins = parser_result.suggestJoins;
    let paths = tableIdentifierChainsToPaths(suggestJoins.tables);
    if (!paths.length || paths.some(path=>path[0]==undefined)) {
      suggests.isSuggestJoins = false;
    } else {
      suggests.suggestJoins = [];
      let topJoins = [];
      joins.forEach(join=>{
        if(
          paths.every((path,index)=>{
            return join.tables[index] == path[1]
          })
        ){
          topJoins.push(join);
        }
      })
      topJoins.forEach((value)=>{
        let result = "";
        let meta = [];
        let count = paths.length - 1;
        if (suggestJoins.prependJoin){
          if (value.type[count]){
            result = result + parser_result.lowerCase? value.type[count].toLowerCase() : value.type[count].toUpperCase()
            meta.push({
              value : parser_result.lowerCase? value.type[count].toLowerCase() : value.type[count].toUpperCase(),
              type : 'keyword'
            })
          } else {
            result = result + parser_result.lowerCase ? "join".toLowerCase() : "join".toUpperCase()
          }
        } 
        result += " ";
        meta.push({
          value : " ",
          type : 'base'
        })
        // Предлогаем next таблицу
        result += value.tables[paths.length]
        meta.push({
          value : value.tables[paths.length],
          type : 'table'
        })
        // Добавляем остальные таблицы 
        for (let i = paths.length + 1; i <  value.tables.length; i++) {
          result += " ";
          meta.push({
            value : " ",
            type : 'base'
          })
          if (value.type[i-1]){
            result += result + parser_result.lowerCase? value.type[i-1].toLowerCase() : value.type[i-1].toUpperCase()
            meta.push({
              value : parser_result.lowerCase? value.type[i-1].toLowerCase() : value.type[i-1].toUpperCase(),
              type : 'keyword'
            })
          } else {
            result += result + parser_result.lowerCase ? "join".toLowerCase() : "join".toUpperCase()
          }
          result += " ";
          meta.push({
            value : " ",
            type : 'base'
          })
          result += value.tables[i]
          meta.push({
            value : value.tables[i],
            type : 'table'
          })
        }
        // предлогаем условия ON 
        result += parser_result.lowerCase ? " on " : " ON "
        meta.push({
          value : parser_result.lowerCase ? " on " : " ON ",
          type : 'keyword'
        })
        // Предлагаем столбцы
        let first = true;
        value.joinCols.forEach((columns)=>{
          if (!first) {
            result += parser_result.lowerCase ? ' and ' : ' AND ';
            meta.push({
              value : parser_result.lowerCase ? ' and ' : ' AND ',
              type : 'keyword'
            })
          }
          result += columns[0].columnTable ? columns[0].columnTable + "." + columns[0].columnName : columns[0].columnName
          if (columns[0].columnTable){
            meta.push({
              value : columns[0].columnTable,
              type : 'table'
            })
            meta.push({
              value : '.',
              type : 'base'
            })
            meta.push({
              value : columns[0].columnName,
              type : 'column'
            })
          } else {
            meta.push({
              value : columns[0].columnName,
              type : 'column'
            })
          }
          result += " = "
          meta.push({
            value : ' = ',
            type : 'base'
          })
          result += columns[1].columnTable ? columns[1].columnTable + "." + columns[1].columnName : columns[1].columnName
          if (columns[1].columnTable){
            meta.push({
              value : columns[1].columnTable,
              type : 'table'
            })
            meta.push({
              value : '.',
              type : 'base'
            })
            meta.push({
              value : columns[1].columnName,
              type : 'column'
            })
          } else {
            meta.push({
              value : columns[1].columnName,
              type : 'column'
            })
          }
          first = false;
        })
        suggests.suggestJoins.push({
          value: result,
          weightAdjust: 10,
          meta: meta,
          category: 'JOIN',
          popular: value.popularity,
          details: value
        })
      })
    }
  } else {
    suggests.isSuggestJoins = false;
  }
  // 15. JOIN_CONDITIONS
  if (parser_result.suggestJoinConditions){
    suggests.isSuggestJoinConditions = true;
    const suggestJoinConditions = parser_result.suggestJoinConditions;
    const paths = tableIdentifierChainsToPaths(suggestJoinConditions.tables);
    if (!paths.length || paths.some(path=>path[0]==undefined)) {
      suggests.isSuggestJoinConditions = false;
    } else {
      suggests.suggestJoinConditions = [];
      joins.filter((join)=>{
        return paths.every((path,index)=>path[1]==join.tables[index])
      }).forEach(value => {
        let meta = []
        let result = suggestJoinConditions.prependOn 
        ?
          parser_result.lowerCase ? " on " : " ON "
        :
          ""
        meta.push({
          value :suggestJoinConditions.prependOn 
          ?
            parser_result.lowerCase ? " on " : " ON "
          :
            "",
          type : 'keyword'
        })
        let first = true;
        value.joinCols.forEach((columns)=>{
          if (
            // Необходимо описать, что используются
            columns.every(cl=>{
              return paths.some(pt=>{
                return pt[1] == cl.columnTable
              })
            })
          ) {
            if (!first) {
              result += parser_result.lowerCase ? ' and ' : ' AND ';
              meta.push({
                value : parser_result.lowerCase ? ' and ' : ' AND ',
                type : 'keyword'
              })
            }
            result += columns[0].columnTable ? columns[0].columnTable + "." + columns[0].columnName : columns[0].columnName
            if (columns[0].columnTable){
              meta.push({
                value : columns[0].columnTable,
                type : 'table'
              })
              meta.push({
                value : '.',
                type : 'base'
              })
              meta.push({
                value : columns[0].columnName,
                type : 'column'
              })
            } else {
              meta.push({
                value : columns[0].columnName,
                type : 'column'
              })
            }
            result += " = "
            meta.push({
              value : " = ",
              type : 'base'
            })
            result += columns[1].columnTable ? columns[1].columnTable + "." + columns[1].columnName : columns[1].columnName
            if (columns[1].columnTable){
              meta.push({
                value : columns[1].columnTable,
                type : 'table'
              })
              meta.push({
                value : '.',
                type : 'base'
              })
              meta.push({
                value : columns[1].columnName,
                type : 'column'
              })
            } else {
              meta.push({
                value : columns[1].columnName,
                type : 'column'
              })
            }
            first = false;
          }
        })
        suggests.suggestJoinConditions.push({
          value: result,
          weightAdjust: 10,
          meta: meta,
          category: 'JOIN',
          popular: value.popularity,
          details: value
        })
      })
    }
  } else {
    suggests.isSuggestJoinConditions = false
  }
  // 16. AGGREGATE FUNCTIONS
  if (
    parser_result.suggestAggregateFunctions && 
    parser_result.suggestAggregateFunctions.tables.length
  ){
    suggests.isSuggestAggregateFunctions = true;
    const suggestAggregateFunctions = parser_result.suggestAggregateFunctions;
    let paths = tableIdentifierChainsToPaths(suggestAggregateFunctions.tables);
    paths = paths.filter(path=>{
      return( 
        (path[0] !== undefined) && 
        ( tables.commonTables.some(table=>table.databaseName == path[0] && table.tableName == path[1]) ||
          tables.userTables.some(table=>table.databaseName == path[0] && table.tableName == path[1]))
      )
    })
    
    if (paths.length == 0 ){
      suggests.isSuggestAggregateFunctions = false;
    } else {
      suggests.suggestAggregateFunctions = [];
      aggregateFunctions.filter((func)=>{
        return paths.every((path)=>func.tables.includes(path[1]))
      }).forEach((func)=>{
        let description = '';
        functions.forEach((cat)=>{
          if (cat.name == 'Aggregate'){
            cat.functions.forEach(el=>{
              if (el.name = func.name){
                description = el.description
              }
            })
          }
        })
        suggests.suggestAggregateFunctions.push({
          value: func.signature,
          weightAdjust: 10,
          meta: {...func,description},
          category: 'POPULAR_AGGREGATE',
          popular: func.popularity,
          details: func
        })
      })
    }
    // Необходимо отобрать подходящие предложения
  } else {
    suggests.isSuggestAggregateFunctions = false
  }
  //17. GROUP_BYS
  // Вспомогательная функция
  const handlePopularGroupByOrOrderBy = (optimizerAttribute, suggestSpec) => {
    let paths = [];
    if (!suggestSpec.tables) return [];
    paths = tableIdentifierChainsToPaths(suggestSpec.tables)
    if (paths.some((path)=>{
      return (path[0] == undefined) || 
        (!(tables.commonTables.some(table=>table.databaseName == path[0] && table.tableName == path[1] )) &&
        !(tables.userTables.some(table=>table.databaseName == path[0] && table.tableName == path[1] )))
    })) return [];
    const prefix = suggestSpec.prefix
    ? 
    (parser_result.lowerCase ? suggestSpec.prefix.toLowerCase() : suggestSpec.prefix) + ' '
    : 
    ''
    if ('groupByColumn' == optimizerAttribute) {
      return groupbys.filter(grb=>paths.every(path=>grb.table.includes(path[1]))).map(grb=>{
        return({
          value: prefix + grb.value,
          weightAdjust: 10,
          meta: [prefix,grb.value,'grb'],
          category: 'POPULAR_GROUP_BY',
          popular: grb.popularity,
          details: grb
        })
      })
    }
    if ('orderByColumn' == optimizerAttribute) {
      return orderbys.filter(orb=>paths.every(path=>orb.table.includes(path[1]))).map(orb=>{
        return({
          value: prefix + orb.value,
          weightAdjust: 10,
          meta: [prefix,orb.value,'orb'],
          category: 'POPULAR_ORDER_BY',
          popular: orb.popularity,
          details: orb
        })
      })
    }
  }
  // Основная функция
  if (parser_result.suggestGroupBys){
    suggests.isSuggestGroupBys = true
    let suggestGroupBys = parser_result.suggestGroupBys;
    let res = handlePopularGroupByOrOrderBy('groupByColumn',suggestGroupBys)
    if (res.length == 0){
      suggests.isSuggestGroupBys = false
    } else {
      suggests.suggestGroupBys = res;
    }
  } else {
    suggests.isSuggestGroupBys = false
  }
  //18. ORDER_BYS
  if (parser_result.suggestOrderBys){
    suggests.isSuggestOrderBys = true
    let suggestOrderBys = parser_result.suggestOrderBys;
    let res = handlePopularGroupByOrOrderBy('orderByColumn',suggestOrderBys)
    if (res.length == 0){
      suggests.isSuggestOrderBys = false
    } else {
      suggests.suggestOrderBys = res;
    }
  } else {
    suggests.isSuggestOrderBys = false
  }
  //19. FILTERS 
  // Вспомогательная функция getPaths
  if (parser_result.suggestFilters){
    suggests.isSuggestFilters = true;
    const suggestFilters = parser_result.suggestFilters;
    let paths = tableIdentifierChainsToPaths(suggestFilters.tables);
    paths = paths.filter(path=>{
      return( 
        (path[0] !== undefined) && 
        ( tables.commonTables.some(table=>table.databaseName == path[0] && table.tableName == path[1]) ||
          tables.userTables.some(table=>table.databaseName == path[0] && table.tableName == path[1]))
      )
    }) 
    if (paths.length == 0){
      suggests.isSuggestFilters = false;
    } else {
      const prefix = suggestFilters.prefix
      ? 
      (parser_result.lowerCase ? suggestFilters.prefix.toLowerCase() : suggestFilters.prefix) + ' '
      : 
      ''
      let res = filtres.filter(filter=>{
        return paths.every(path=>filter.table.includes(path[1]))
      }).map(filter=>{
        return({
          value: prefix + filter.value,
          weightAdjust: 10,
          meta: [prefix,filter.value,'whr'],
          category: 'POPULAR_FILTER',
          popular: filter.popularity,
          details: filter
        })
      })
      if ( res ){
        suggests.suggestFilters = res
      } else {
        suggests.isSuggestFilters = false;
      }
    }
  } else {
    suggests.isSuggestFilters = false;
  }
  //20. POPULAR_TABLES
  // Уже учтено
  //21. POPULAR_COLUMNS
  // Уже учтено
  return suggests
}

export default getSuggests