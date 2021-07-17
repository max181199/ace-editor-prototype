import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import AceEditorPrototype from './ace-editor-prototype'


ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/ace-editor-prototype">
        <AceEditorPrototype/>
      </Route>
    </Switch>
  </Router>,
  document.getElementById("root")
);


