import { useState } from "react";
import Greeting from "./Components/Greeting";
import { FormulaBuilder } from "./Components/FormulaBuilder";

function AboutPage() {
  return (
    
    <section style={{ padding: 20, textAlign: "left" }}>
      

      <h2 style={{ marginTop: 0, color: "#001450" }}>About AutomatedGL</h2>
      <p>
        AutomatedGL is a formula builder and proof-search interface for the provability logic GL. It is a rough implementation of the 
        algorithm described in the paper <a href="https://arxiv.org/abs/2606.03484" target="_blank" rel="noopener noreferrer">
        Optimizing Proof-Search via Linearization for Gödel-Löb Logic with Tree-Hypersequents</a> by T. S. Lyon and O. Y. A. A. Taher. The difference
        between the algorithm implemented here and the one described in the paper is that this implementation does not use the system <a href="https://shs.hal.science/halshs-00775808/document" target="_blank" rel="noopener noreferrer">CSGL</a> as 
        its proof calculus, but <a href="https://link.springer.com/article/10.1007/s10992-005-2267-3" target="_blank" rel="noopener noreferrer">G3KGL</a>. This application was made as part 
        of Omar Y. A. A. Taher's Master's thesis at TU Dresden under supervision of Dr. Tim S. Lyon and Dr. habil. Hannes Straß. Taher is a recepient of a DAAD scholarship through the
        School of Embedded Composite Artificial Intelligence <a href="https://secai.org/" target="_blank" rel="noopener noreferrer">(SECAI)</a>.
      </p>

      <h2 style={{ marginTop: 20, color: "#001450" }}>Useful Technical Details</h2>
      <p>
        Internally, the proof search algorithm uses only the connectives → and ☐, and the symbol ⊥. This means that any formula containing other connectives will be normalized before proof search.
        You can use the "Normalize" button to convert your formula to the equivalent one that is passed on to the algorithm. You don't need to click it before checking validity, it is done for you automatically. 
         
      </p>

      <h2 style={{ marginTop: 20, color: "#001450" }}>Brief Note on Space Complexity</h2>
      <p>
        A large contribution of the paper this implementation is based on is that the algorithm runs in PSpace in the length of the input forumula. 
        However the existence of a log where you can see all the validation attempts and their corresponding sequents, means definitionally that this is not Pspace. 
        For this reason, you are given the choice of disabling the log. 
      </p>

      
      <h2 style={{ marginTop: 20, color: "#001450" }}>Need a Valid Formula?</h2>
      <p>
        We understand that it can be difficult to come up with a valid formula in GL, so we have provided a CSV 
        file of 269 valid formulae of size 2 to 17 that you can use to test the application. Download it <a href={`${import.meta.env.BASE_URL}269validFormulae.csv`} download style={{ color: "#0066cc", fontWeight: 600 }}>here</a>.
        You can also download one for invalid formulae <a href={`${import.meta.env.BASE_URL}1192invalidFormulae.csv`} download style={{ color: "#0066cc", fontWeight: 600 }}>here</a>. Admittedly, the invalid formulae are mostly not very interesting. These respective CSV files are what we draw from when you click the "Random Valid Formula" or "Random Invalid Formula" buttons. Note that some formulae will take sometime to compute, especially the larger ones. The application will not freeze, but it may take a while to return a result.
      </p>
     

    </section>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "about">("home");

  return (
    <>
      <header className="app-header">
        <Greeting />
        <button
          className="app-header-link"
          onClick={() => setCurrentPage((prev) => (prev === "home" ? "about" : "home"))}
        >
          {currentPage === "home" ? "ABOUT" : "HOME"}
        </button>
      </header>

      <main className="app-content">
        {currentPage === "home" ? <FormulaBuilder /> : <AboutPage />}
      </main>
    </>
  );
}

export default App;
