import React, { useEffect, useRef, useState } from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BaseItem from './menu_items/base_item';
import ExtBaseItem from './menu_items/extBase_item'
import FunctionItem from './menu_items/function_item'
import JoinItem from './menu_items/join_item';
import AggrFunctionItem from './menu_items/aggrFunction_item'
import OrbGrbWhrItem from './menu_items/orbgrbwhr_item'
import { blue, green, grey, pink, yellow } from '@material-ui/core/colors';

const Autocomplete = ({ open , position , suggests, suggestNumber , fucusOnEditor   }) => {
  let left = position.left
  let top = position.top
  const menuRef = useRef()
  useEffect(()=>{
    if (menuRef.current){
      let item = menuRef.current.children[suggestNumber]
      if (item){
        item.scrollIntoView({
          behavior : 'smooth',
          block : 'nearest'
        })
      }
    }
  },[suggestNumber])
  return (
    <Menu
      disableEnforceFocus
      disableRestoreFocus
      id="autocomplete_popover"
      anchorReference="anchorPosition"
      anchorPosition={{ left, top }}
      autoFocus = {false}
      onFocus={()=>fucusOnEditor()}
      open={open}
      PaperProps={{
        style: {
          maxHeight: '200px',
          width: '30ch',
          fontSize : '16px'
        }
      }}
      MenuListProps={{
        ref : menuRef,
      }}
    >
      { 
        suggests 
        ?  
        suggests.map((suggest,index)=>{
          if (!suggest) return null;
          switch (suggest.category) {
            case 'KEYWORD':
              return <BaseItem
                      suggest={suggest}
                      isChosen={index==suggestNumber} 
                      color={blue[700]} 
                      type = 'Keyword'
                      index={index}
                      key = {`container_autocomplete_menu_item_${index}`}
                      ref={null}
                    />
            case 'COL_REF_KEYWORD':
              return <BaseItem
                      suggest={suggest}
                      isChosen={index==suggestNumber} 
                      color={pink[500]} 
                      type = 'Colref'
                      index={index}
                      key = {`container_autocomplete_menu_item_${index}`}
                      ref={null}
                    />
            case 'IDENTIFIERS':
              return <BaseItem
                      suggest={suggest}
                      isChosen={index==suggestNumber} 
                      color={'grey'} 
                      type = 'IDF'
                      index={index}
                      key = {`container_autocomplete_menu_item_${index}`}
                      ref={null}
                    />
            case 'COLUMN':
              return <BaseItem
                        suggest={suggest}
                        isChosen={index==suggestNumber} 
                        color={green[500]} 
                        type = 'Column'
                        index={index}
                        key = {`container_autocomplete_menu_item_${index}`}
                        ref={null}
                      />
            case 'COMMON_TABLE_EXPRESSIONS':
              let name = suggest.meta.map(el=>{
                return {
                  value : el,
                  color : 'grey'
                }
              })
              name[1].color = blue[700];
              return <ExtBaseItem 
                        name = {name} 
                        isChosen = {index==suggestNumber}  
                        index={index}  
                        type={'CTE'}
                        key = {`container_autocomplete_menu_item_${index}`}
                        ref={null}
                      />
            case 'FUNCTION' :
              return <FunctionItem
                      suggest={suggest}
                      isChosen={index==suggestNumber} 
                      index={index}
                      key = {`container_autocomplete_menu_item_${index}`}
                      ref={null}
                    />
            case 'TABLE':
              let name2 = suggest.meta.map(el=>{
                return {
                  value : el,
                  color : 'grey'
                }
              })
              name2[1].color = blue[700];
              name2[2].color = green[500];
              return <ExtBaseItem 
                        name = {name2} 
                        isChosen = {index==suggestNumber}  
                        index={index}  
                        type={'Table'}
                        key = {`container_autocomplete_menu_item_${index}`}
                        ref={null}
                      />
            case 'VARIABLE':
              return <BaseItem
                        suggest={suggest}
                        isChosen={index==suggestNumber} 
                        color={'black'} 
                        type = 'Var'
                        index={index}
                        key = {`container_autocomplete_menu_item_${index}`}
                        ref={null}
                      />
            case 'JOIN' :
              let name3 = suggest.meta.map(el=>{
                let color = 'black';
                if ( el.type == 'keyword') color = blue[700];
                if ( el.type == 'table') color = pink[500];
                if ( el.type == 'column') color = green[500];
                return({
                  value : el.value,
                  color : color
                })
              })
              let content = suggest.meta.map(el=>{
                let color = grey[800];
                if ( el.type == 'keyword') color = blue[700];
                return({
                  value : el.value,
                  color : color
                })
              })
              return  <JoinItem
                        name = {name3} 
                        content = {content}
                        isChosen={index==suggestNumber} 
                        index={index}
                        ref={null}
                        key = {`container_autocomplete_menu_item_${index}`}
                      />
            case 'POPULAR_AGGREGATE' :
              let name4 = suggest.meta.name;
              let arguments2 = suggest.meta.signature.slice(suggest.meta.name.length + 1,suggest.meta.signature.length - 1)
              let description  = suggest.meta.description
              return  <AggrFunctionItem
                        name={name4}
                        argument = {arguments2}
                        description = {description}
                        isChosen={index==suggestNumber} 
                        index={index}
                        ref={null}
                        key = {`container_autocomplete_menu_item_${index}`}
                      />
            case 'POPULAR_GROUP_BY':
              let prefix = suggest.meta[0]
              let val = suggest.meta[1]
              let type = suggest.meta[2]
              return  <OrbGrbWhrItem
                        prefix={prefix} 
                        variable = {val} 
                        type={type}
                        isChosen={index==suggestNumber} 
                        index={index}
                        ref={null}
                        key = {`container_autocomplete_menu_item_${index}`}
                      />
            case 'POPULAR_ORDER_BY':
              let prefix2 = suggest.meta[0]
              let val2 = suggest.meta[1]
              let type2 = suggest.meta[2]
              return  <OrbGrbWhrItem
                        prefix={prefix2} 
                        variable = {val2} 
                        type={type2}
                        isChosen={index==suggestNumber} 
                        index={index}
                        ref={null}
                        key = {`container_autocomplete_menu_item_${index}`}
                      />
            case 'POPULAR_FILTER':
              let prefix3 = suggest.meta[0]
              let val3 = suggest.meta[1]
              let type3 = suggest.meta[2]
              return  <OrbGrbWhrItem
                        prefix={prefix3} 
                        variable = {val3} 
                        type={type3}
                        isChosen={index==suggestNumber} 
                        index={index}
                        ref={null}
                        key = {`container_autocomplete_menu_item_${index}`}
                      />
            default:
              return null;
          }  
        })
        :
        null
      }
    </Menu>
  )
}

export default Autocomplete