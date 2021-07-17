import React, { useEffect, useRef ,useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import styled from 'styled-components';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Popover from '@material-ui/core/Popover';
import { grey, orange } from '@material-ui/core/colors';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

const StyleMenuItem  = styled(MenuItem)`
  background-color : ${props=>props.ischosen=='true'?'rgba(210,210,210,0.6)':'white'}!important;
  :hover{
    background-color : ${props=>props.ischosen=='true'?'rgba(210,210,210,0.6)':'rgba(210,210,210,0.3)'}!important;
  }
`;
const Name = styled(Typography)`
  font-size : 16px!important;
  max-width : 15ch;
  font-weight:300;
`
const Type = styled(Typography)`
  color : grey;
  font-size : 16px!important;
  max-width : 10ch;
  font-weight:300;
`
const FunctionName = styled.span`
  color : ${orange[700]}
`
const FunctionNameBold = styled.span`
  color : ${grey[700]};
  font-weight:700;
`
const FunctionNameThin = styled.span`
  color : ${grey[800]};
  font-weight:200;
`

const FunctionBrackets = styled.span`
  color : black;
`
const StyledCard = styled(Card)`
  min-width : 20ch;
  max-width : 35ch;
`
const StyledCardContent = styled(CardContent)`

`
const NameFunction = styled(Typography)`
  color : grey;
  font-size : 13px;
`

const AggrFunctionItem = React.forwardRef(({name, argument, description , isChosen , index},ref) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handlePopoverOpen = (event) => {
    setAnchorEl(event.target);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  return(
    <React.Fragment>
      <StyleMenuItem 
        ischosen={`${isChosen}`}
        key = {`autocomplete_menu_item_${index}`}
        id  = {`autocomplete_menu_item_${index}`}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
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
            <Name noWrap>
              <FunctionName>{name}</FunctionName>
              <FunctionBrackets>{` (${argument})` }</FunctionBrackets>
            </Name>
          </Grid>
          <Grid item zeroMinWidth>
            <Type noWrap >{'AggFunc'}</Type>
          </Grid>
        </Grid>
      </StyleMenuItem>
      <Popover
        id = {`autocomplete_menu_item_${index}_popover`}
        style={{pointerEvents : 'none'}}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        disableEnforceFocus
      >
        <StyledCard>
          <StyledCardContent style={{backgroundColor:'rgba(190,210,210,0.3)',paddingTop:'5px',paddingBottom:'5px'}}>
            <NameFunction noWrap >
              <FunctionNameBold>
                {`${name.toUpperCase()}`}
              </FunctionNameBold> 
            </NameFunction>
          </StyledCardContent>
          <StyledCardContent style={{paddingTop:'5px',paddingBottom:'5px'}}>
            <NameFunction>
              <FunctionNameThin>
                {`${name}(${argument})`}
              </FunctionNameThin> 
            </NameFunction> 
          </StyledCardContent>
          <StyledCardContent style={{backgroundColor:'rgba(190,210,210,0.3)',paddingTop:'5px',paddingBottom:'5px'}}>
            <NameFunction noWrap >
              <FunctionNameBold>
                {'description'.toUpperCase()}
              </FunctionNameBold> 
            </NameFunction>
          </StyledCardContent>
          <StyledCardContent style={{paddingTop:'5px',paddingBottom:'5px'}}>
            <NameFunction>
              <FunctionNameThin>
                { description
                  ?
                  `${description}`
                  :
                  '...'
                }
              </FunctionNameThin> 
            </NameFunction> 
          </StyledCardContent>
        </StyledCard>
      </Popover>
    </React.Fragment>
  )
}) 

export default AggrFunctionItem;