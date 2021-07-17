import React from 'react';
import styled from 'styled-components'
import { createGlobalStyle } from 'styled-components'
import AceEditorProtorype from './aceEditorPrototype'

const GlobalStyle = createGlobalStyle`
  body {
    color: black;
    margin : 0;
    padding : 0;
    background-color : rgba(0,0,0,0.8);
    display : flex;
    height : 100vh;
    width : 100vw;
    justify-content: center;
    align-items: center;
  }
`

const EditorContainer = styled.div`
  background-color : white;
  display : flex;
  margin : 0;
  padding : 0;
  height : 90vh;
  width : 94vw;
`


const indexAceEditorPrototype = () => {
  return(
    <React.Fragment>
      <GlobalStyle/>
      <EditorContainer>
        <AceEditorProtorype/>
      </EditorContainer>
    </React.Fragment>
  )
}

export default indexAceEditorPrototype