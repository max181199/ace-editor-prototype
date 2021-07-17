import React, { useEffect ,useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import styled from 'styled-components';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Popover from '@material-ui/core/Popover';
import { grey } from '@material-ui/core/colors';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

const StyleMenuItem  = styled(MenuItem)`
  background-color : ${props=>props.ischosen=='true'?'rgba(210,210,210,0.6)':'white'}!important;
  :hover{
    background-color : ${props=>props.ischosen=='true'?'rgba(210,210,210,0.6)':'rgba(210,210,210,0.3)'}!important;
  }
`;
const Name = styled(Typography)`
  font-size : 13px!important;
  max-width : 15ch;
  font-weight:300;
`
const Type = styled(Typography)`
  color : grey;
  font-size : 16px!important;
  max-width : 10ch;
  font-weight:300;
`
const NamePart = styled.span`
  color : ${props=>props.mycolor};
`

const JoinNameBold = styled.span`
  color : ${grey[700]};
  font-weight:700;
`
const JoinNameThin = styled.span`
  color : ${grey[800]};
  font-weight:200;
`


const StyledCard = styled(Card)`
  min-width : 20ch;
  max-width : 35ch;
`
const StyledCardContent = styled(CardContent)`

`
const NameJoin = styled(Typography)`
  color : grey;
  font-size : 13px;
`

const JoinItem = React.forwardRef(({name ,content , isChosen , index},ref) => {
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
              { 
                name.map((el,id)=>{
                  return (
                    <NamePart 
                      key={`autocomplete_menu_item_${index}_part_${id}`} 
                      mycolor={el.color}
                    >
                      {el.value}
                    </NamePart>
                  )  
                })
              }
            </Name>
          </Grid>
          <Grid item zeroMinWidth>
            <Type noWrap >{'Function'}</Type>
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
            <NameJoin noWrap >
              <JoinNameBold>
                {`${'join'.toUpperCase()}`}
              </JoinNameBold> 
            </NameJoin>
          </StyledCardContent>
          <StyledCardContent style={{paddingTop:'5px',paddingBottom:'5px'}}>
            <NameJoin>
              <JoinNameThin>
                { 
                  content.map((el,id)=>{
                    return (
                      <NamePart 
                        key={`autocomplete_menu_item_${index}_part_${id}`} 
                        mycolor={el.color}
                      >
                        {el.value}
                      </NamePart>
                    )  
                  })
                }
              </JoinNameThin> 
            </NameJoin> 
          </StyledCardContent>
        </StyledCard>
      </Popover>
    </React.Fragment>
  )
}) 

export default JoinItem;