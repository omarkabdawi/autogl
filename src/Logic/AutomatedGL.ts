import * as treeSeq from "../Types/treeSeq";
import { propagationKey } from "../Types/treeSeq";

export function AutoGL(seq: treeSeq.TreeSeq, log: (message: string) => void): boolean{
    
    //log(treeSeq.printTreeSeq(seq));

    if (treeSeq.isAxiomQuestionMark(seq)) {
        log("Axiom reached");
        return true;
    }
    else if (treeSeq.isStableQuestionMark(seq)) {
        log("Stable sequent reached without being an axiom");
        return false;
    }
    let i = 0;
    while (i < seq.Gamma.length) {
        if (!seq.Gamma[i].divorced && seq.Gamma[i].formula.type === "op" && seq.Gamma[i].formula.op === "-->") {
        //NOTE TO OMAR: ditch cloning and just try to doing it like the paper, left first then right if it succeeds keeping only one copy
        
        const newFormulae = treeSeq.implicationLeftRule(seq.Gamma[i]);
        let clone = treeSeq.cloneTreeSeq(seq);
        let Name = seq.Gamma[i].arepresentation;
        log("Applying implication left rule" + " on formula " + Name);
        if(!treeSeq.AlreadyIN(clone.Gamma,newFormulae[1])){
            let output = "Adding " + newFormulae[1].arepresentation + " to Gamma.";
            log(output);
            treeSeq.addToGamma(clone, newFormulae[1]);
        }else{
            let output =  newFormulae[1].arepresentation + " was already in Gamma."
            log(output);
        }
        
        if(!treeSeq.AlreadyIN(seq.Delta,newFormulae[0])){
            let output = "Adding " + newFormulae[0].arepresentation + " to Delta."; 
            log(output);
            treeSeq.addToDelta(seq, newFormulae[0]);
        }else{
            let output =  newFormulae[0].arepresentation + " was already in Delta."
            log(output);
        }
        

        if(AutoGL(clone, log)){
            log("Left branch of implication succeeded, trying right branch:");
            log(treeSeq.printTreeSeq(seq));
            return AutoGL(seq, log);            
        }else{
            log("Left branch of implication failed, no further actions");
        }
        //return AutoGL(clone) && AutoGL(seq);
        } 
        i++;
    }

    i = 0;
    while (i < seq.Delta.length) {
        if (!seq.Delta[i].divorced && seq.Delta[i].formula.type === "op" && seq.Delta[i].formula.op === "-->") {
        //x : ϕ → ψ ∈ ∆ and either x : ϕ ̸∈ Γ or x : ψ ̸∈ ∆
        const newFormulae = treeSeq.implicationRightRule(seq.Delta[i]);
        let Name = seq.Delta[i].arepresentation;
         log("Applying implication right rule" + " on formula " + Name);

        if(!treeSeq.AlreadyIN(seq.Gamma,newFormulae[0])){
            treeSeq.addToGamma(seq, newFormulae[0]);
            log("Adding " + newFormulae[0].arepresentation + " to Gamma.");
        }else{
            let output =  newFormulae[0].arepresentation + " was already in Gamma."
            log(output);
        }
        if(!treeSeq.AlreadyIN(seq.Delta,newFormulae[1])){
            treeSeq.addToDelta(seq, newFormulae[1]);
            log("Adding " + newFormulae[1].arepresentation + " to Delta.");
        }else{
            let output =  newFormulae[1].arepresentation + " was already in Delta."
            log(output);
        }
        //log("Applying implication right rule");
        return AutoGL(seq, log);

        }
        i++;
    }
    i = 0;
    while (i < seq.Tel.length) {

        let j = 0;
        while (j < seq.Tel.length) {

            if (seq.Tel[i].to.label === seq.Tel[j].from.label) {

            const newRel = treeSeq.createrelation(seq.Tel[i].from,seq.Tel[j].to);

            if (!treeSeq.alreadyIN( seq.Tel,newRel)) {
                let r1 = seq.Tel[i].reperesentation;
                let r2 = seq.Tel[j].reperesentation;
                log("Applying transitivity rule on relations " + r1 + " and " + r2);
                log("Adding relation " + treeSeq.relationToString(newRel) + " to Tel.");
                treeSeq.addRelation(seq,newRel);
                return AutoGL(seq, log);
            }
        }

        j++;
    }

    i++;
    }

     i = 0;
     while (i < seq.Gamma.length) {
        //box left
        if (seq.Gamma[i].formula.type === "unary" && seq.Gamma[i].formula.op === "Box") {
        let j = 0;
        while (j < seq.Tel.length) {
            if (seq.Tel[j].from.label === seq.Gamma[i].world.label) {
                //x : □ϕ ∈ Γ, xRy ∈ T , but y : ϕ ̸∈ Γ
                const key =propagationKey(seq.Gamma[i],seq.Tel[j]);

                if (!seq.boxPropagation[key]) {
                    const newFormulae = treeSeq.leftBoxRules(seq.Gamma[i], seq.Tel[j]);
                    if(!treeSeq.AlreadyIN(seq.Gamma,newFormulae[0])){
                        treeSeq.addToGamma(seq, newFormulae[0]);
                        let Name = seq.Gamma[i].arepresentation;
                        log("Applying box left rule on formula " + Name + " and relation " + seq.Tel[j].reperesentation);
                        let output = "Box left rule applied, adding " + newFormulae[0].arepresentation + " to Gamma.";
                        log(output);
                    }else{
                        let output = "Box left rule applied but nothing new was added because the formula " + seq.Gamma[i].arepresentation + " was already in Gamma."
                        log(output);
                        //console.log("Box left rule applied but nothing new was added because the formula was already in Gamma");
                    }
                    //treeSeq.addToGamma(seq, newFormulae[0]);
                    // treeSeq.addToGamma(seq, newFormulae[1]);

                    seq.boxPropagation[key] = true;
                    const allTrue = Object.values(seq.boxPropagation).every(v => v);
                    if(allTrue){
                        seq.Gamma[i].divorced = true;
                    }else{
                        seq.Gamma[i].divorced = false;
                    }
                    
                    return AutoGL(seq, log);
                }
                
            } 
            j++;
        }
        } 
        i++;
    }
    
    if (treeSeq.isSaturatedQuestionMark(seq)||seq.Tel.length === 0) {
       log("Saturated, Now we can try box rights");
        let j = 0;
        let evilBoxTrees :treeSeq.TreeSeq[] =  [];
        while (j < seq.Delta.length) {
            if (!seq.Delta[j].divorced && seq.Delta[j].formula.type === "unary" && seq.Delta[j].formula.op === "Box") {
                if(treeSeq.isLeafQuestionMark(seq, seq.Delta[j].world.label)){
                    const newWorld = treeSeq.createworld();
                    const newRelation = treeSeq.createrelation(seq.Delta[j].world, newWorld);
                    const newSeq = treeSeq.cloneTreeSeq(seq);
                    treeSeq.addRelation(newSeq, newRelation);
                    const boxFormula = treeSeq.createlabelledFormula(newWorld, seq.Delta[j].formula);
                    treeSeq.addToGamma(newSeq, boxFormula);
                    const currentExpr= seq.Delta[j].formula;
                    if(currentExpr.type === "unary" && seq.Delta[j].formula.op === "Box"){
                    const innerFormula = currentExpr.expr;
                    const innerLabelledFormula = treeSeq.createlabelledFormula(newWorld, innerFormula);
                    treeSeq.addToDelta(newSeq, innerLabelledFormula);
                    }

                    seq.Delta[j].divorced = true;
                    evilBoxTrees.push(newSeq);
                }
            }
            j++;
        }
        let k = 0;
        while (k < evilBoxTrees.length) {
            log("Trying box right tree:");
            log(treeSeq.printTreeSeq(evilBoxTrees[k]));

            if (AutoGL(evilBoxTrees[k], log)) {
                return true;
            }else{
                evilBoxTrees[k] = treeSeq.createMTTreeSeq();
            }
            k++;
            log("All box right trees failed");
        }return false;
    }
    
    throw new Error("Unreachable state");
}