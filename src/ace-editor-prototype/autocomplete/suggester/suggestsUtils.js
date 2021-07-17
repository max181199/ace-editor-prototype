import * as ace from 'ace-builds';
let AceRange =  ace.require('ace/range').Range;

const sortSuggests = (suggests) => {
  // console.log('SUG:::',suggests.sort((a,b)=>{
  //   if (a.weightAdjust > b.weightAdjust)  return -1;
  //   if (a.weightAdjust == b.weightAdjust) return 0;
  //   if (a.weightAdjust < b.weightAdjust) return 1;
  // }))
  return suggests.sort((a,b)=>{
    if (a.weightAdjust > b.weightAdjust)  return -1;
    if (a.weightAdjust == b.weightAdjust) return 0;
    if (a.weightAdjust < b.weightAdjust) return 1;
  })
}

const updateWeightSuggests  = (suggest) => {
  let max  = suggest.reduce((acc,cur)=>{
    if (cur.popular){
      if (cur.popular > acc) return cur.popular
      return acc
    } else return acc
  },0)
  max += 1
  suggest.map(sg=>{
    if (sg.popular){
      sg.weightAdjust = sg.weightAdjust + sg.popular / max;
      return sg
    } else return sg
  })
  return suggest
}

const getPrefix = (editor,isDelete) => {
  let left = null;
  if (!isDelete){
    left = new AceRange(0, 0, editor.getCursorPosition().row, editor.getCursorPosition().column + 1);
  } else {
    left = new AceRange(0, 0, editor.getCursorPosition().row, editor.getCursorPosition().column);
  }
  return editor.session.getTextRange(left).split(' ').pop().split('\n').pop()
}

const filterSuggests = (editor,suggests) => {
  let prefix = getPrefix(editor)
  //console.log(suggests)
  return suggests.filter((suggest)=>suggest.value.toLowerCase().startsWith(prefix.toLowerCase()))
}


const groupSuggests = (suggests) => {
  let data = []
  if (suggests.isKeywords) data = [...data,...updateWeightSuggests(suggests.keywords)]
  if (suggests.isSuggestAggregateFunctions) data = [...data,...updateWeightSuggests(suggests.suggestAggregateFunctions)]
  if (suggests.isSuggestColRefKeywords) data = [...data,...updateWeightSuggests(suggests.suggestColRefKeywords)]
  if (suggests.isSuggestColumnAliases) data = [...data,...updateWeightSuggests(suggests.suggestColumnAliases)]
  if (suggests.isSuggestColumns) data = [...data,...updateWeightSuggests(suggests.suggestColumns)]
  if (suggests.isSuggestCommonTableExpressions) data = [...data,...updateWeightSuggests(suggests.suggestCommonTableExpressions)]
  if (suggests.isSuggestFilters) data = [...data,...updateWeightSuggests(suggests.suggestFilters)]
  if (suggests.isSuggestFunctions) data = [...data,...updateWeightSuggests(suggests.suggestFunctions)]
  if (suggests.isSuggestGroupBys) data = [...data,...updateWeightSuggests(suggests.suggestGroupBys)]
  if (suggests.isSuggestIdentifiers) data = [...data,...updateWeightSuggests(suggests.suggestIdentifiers)]
  if (suggests.isSuggestJoinConditions) data = [...data,...updateWeightSuggests(suggests.suggestJoinConditions)]
  if (suggests.isSuggestJoins) data = [...data,...updateWeightSuggests(suggests.suggestJoins)]
  if (suggests.isSuggestOrderBys) data = [...data,...updateWeightSuggests(suggests.suggestOrderBys)]
  if (suggests.isSuggestTables) data = [...data,...updateWeightSuggests(suggests.suggestTables)]
  if (suggests.isSuggestValues) data = [...data,...updateWeightSuggests(suggests.suggestValues)]
  return data
}

export {
  sortSuggests,
  groupSuggests,
  getPrefix,
  filterSuggests
}