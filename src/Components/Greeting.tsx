import type { JSX } from "react";
import logo from "C:/Users/Omar/Documents/TypeScript/AutomatedGL/dist/assets/TUD_Logo.svg";


export function Greeting(): JSX.Element {
  return (
    <div className="app-greeting">
      
      <a href="https://tu-dresden.de/?set_language=en"><img src={logo} alt="AutomatedGL Logo" className="logo" /></a>
      <p>Automated Proof Search Application for the Provability Logic GL</p>
    </div>
  );
}

export default Greeting;