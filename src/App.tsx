import styles from './App.module.scss';
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import { ThreeFrame } from './ThreeFrame/ThreeFrame';

export default function App() {
  return (
    <Router>
      <div className={styles.App}>
        <Switch>
          <Route exact path="/">
          </Route>
          <Route path="/move-points-along-normals">
            <ThreeFrame modelPaths={[
              "https://vex-assets.s3.amazonaws.com/MovePointsAlongNormalsAvocados.glb",
              // "https://bmp-assets.s3.amazonaws.com/leftBaseGrass.glb",
              // "https://bmp-assets.s3.amazonaws.com/shrubFrontLeft.glb",
              // "https://bmp-assets.s3.amazonaws.com/shrubBackLeft.glb",
              // "https://bmp-assets.s3.amazonaws.com/tree2.glb",
              // "https://bmp-assets.s3.amazonaws.com/tree1.glb",
            ]} 
            HDRI="https://vex-assets.s3.amazonaws.com/quattro_canti.jpg"
            // HDRI=""
            ></ThreeFrame>
          </Route>
          <Route path="/dog"><>
            <ThreeFrame modelPaths={[""]} HDRI=""></ThreeFrame>
          </>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
