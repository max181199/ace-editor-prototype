import React, { useEffect, useRef ,useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import styled from 'styled-components';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

const StyleMenuItem  = styled(MenuItem)`
  background-color : ${props=>props.ischosen=='true'?'rgba(210,210,210,0.6)':'white'}!important;
  :hover{
    background-color : ${props=>props.ischosen=='true'?'rgba(210,210,210,0.6)':'rgba(210,210,210,0.3)'}!important;
  }
`;
const Name = styled(Typography)`
  font-size : 16px!important;
  color : ${props=>props.mycolor};
  max-width : 15ch;
  font-weight:300;
`
const Type = styled(Typography)`
  color : grey;
  font-size : 16px!important;
  max-width : 10ch;
  font-weight:300;
`

const BaseItem = React.forwardRef(({suggest , isChosen , color , type ,index},ref) => {
  let itemRef = useRef();
  let [enableTooltip,setEnableTooltip] = useState(false)
  useEffect(()=>{
    if (itemRef.current){
      if (itemRef.current.scrollWidth > itemRef.current.clientWidth) setEnableTooltip(true)
    }
  })
  return(
      <Tooltip 
        arrow={true}
        enterDelay={300}
        placement="left"
        disableHoverListener = {!enableTooltip}
        disableFocusListener = {!enableTooltip}
        title = {suggest.value} 
      >
        <StyleMenuItem 
          ischosen={`${isChosen}`}
          key = {`autocomplete_menu_item_${index}`}
          id  = {`autocomplete_menu_item_${index}`}
        >
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="100%"
            width="100%"
          >
            <Grid item zeroMinWidth >
              <Name noWrap ref={itemRef} mycolor={color}>{suggest.value}</Name>
            </Grid>
            <Grid item zeroMinWidth>
              <Type noWrap >{type}</Type>
            </Grid>
          </Grid>
        </StyleMenuItem>
      </Tooltip>
  )
})

export default BaseItem;