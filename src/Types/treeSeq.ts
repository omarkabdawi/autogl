import type { Expr } from "../Types/expressions";
import {exprToString} from "../Types/expressions";
const chars = ["x", "y", "z", "w", "v", "u"];

let count = 0;
let index = 0;

function newWorld(): string {
  if (index === chars.length) {
    index = 0;
    count++;
  }

  if (count === 0) {
    return chars[index++];
  }

  return chars[index++] + count.toString();
}

export type world = {
    label: string;
};

export type relation = {
    from: world;
    to: world;
    reperesentation:string;
}; 

export type labelledFormula  = {
    arepresentation: string;
    world: world;
    formula: Expr;
    divorced?: boolean; //if you can not be divorcedm you are set to true
    
}


export type TreeSeq = {
    Tel: relation[]; Gamma: labelledFormula[]; // ⊢
    Delta: labelledFormula[];
    boxPropagation: Record<string, boolean>;
};
export function printTreeSeq(seq: TreeSeq): string {
    let result = "";

    let i = 0;
    while (i < seq.Tel.length) {
        result += seq.Tel[i].reperesentation + ",";
        i++;
    }
    let j = 0;
    while (j < seq.Gamma.length) {
        result += seq.Gamma[j].arepresentation + ",";
        j++;
    }
    result += "⊢";
    let k = 0;
    while (k < seq.Delta.length) {
        result += seq.Delta[k].arepresentation + ",";
        k++;
    }
return result;
}
export function propagationKey( box: labelledFormula,rel: relation): string{
    return box.arepresentation +  "@" +  box.world.label + "->" + rel.to.label
}
export function createworld(): world {
    return { label: newWorld() };
}
export function createrelation(from: world, to: world): relation {
    return { from, to, reperesentation: worldToString(from) + " R " + worldToString(to) };
}
export function createlabelledFormula(world: world, formula: Expr): labelledFormula {
    return { world, formula, divorced: false, arepresentation: `${world.label} : ${exprToString(formula)}` };
}

export function cloneLabelledFormula(formula: labelledFormula): labelledFormula {
    return { arepresentation: formula.arepresentation, world: formula.world, formula: formula.formula, divorced: formula.divorced };
}

export function cloneGammaSlashDelta(formulas: labelledFormula[]): labelledFormula[] {
    let result: labelledFormula[] = [];
    let i = 0;
    while (i < formulas.length) {
        result.push(cloneLabelledFormula(formulas[i]));
        i++;
    }
    
    return result;
}

export function AlreadyIN(GammaORDelta: labelledFormula[], formula: labelledFormula): boolean{

    let i = 0;
    while (i < GammaORDelta.length) {
        if(GammaORDelta[i].arepresentation === formula.arepresentation){
            return true;
        }
        i++;
    }

    return false;
}

export function basic(input:labelledFormula): boolean{
    if (input.formula.type === "var" || input.formula.type === "bottom") {
        return true;
    }
    return false;
}

export function createTreeSeq(input: Expr): TreeSeq {
    const world = createworld();
    const initial = createlabelledFormula(world, input);
    return {
        Tel: [],
        Gamma: [],
        Delta: [initial],
            boxPropagation: {},
        };
    }

export function createMTTreeSeq(): TreeSeq {


    return {
        Tel: [],
        Gamma: [],
        Delta: [],
        boxPropagation: {},
    };
}


export function addToGamma(seq: TreeSeq, formula: labelledFormula): void {
    seq.Gamma.push(formula);
}

export function addToDelta(seq: TreeSeq, formula: labelledFormula): void {
    seq.Delta.push(formula);
}

export function addRelation(seq: TreeSeq, relation: relation): void {
    seq.Tel.push(relation);
}

export function cloneTreeSeq(seq: TreeSeq): TreeSeq {
    return {
        Tel: [...seq.Tel],
        Gamma: cloneGammaSlashDelta(seq.Gamma),
        Delta: cloneGammaSlashDelta(seq.Delta),
        boxPropagation: { ...seq.boxPropagation },
    };
}
export function hugTreeSeq(seq: TreeSeq): labelledFormula[] { //intersection of Gamma and Delta
    const result: labelledFormula[] = [];

    for (const gammaFormula of seq.Gamma) {
        for (const deltaFormula of seq.Delta) {
            if (
                gammaFormula.world.label === deltaFormula.world.label &&
                JSON.stringify(gammaFormula.formula) === JSON.stringify(deltaFormula.formula)
            ) {
                result.push(gammaFormula);
            }
        }
    }

    return result;
}

export function bottominGamma(seq: TreeSeq): boolean {
     let i = 0;
    while (i <seq.Gamma.length) {
        if (seq.Gamma[i].formula.type === "bottom") {
            return true;
        }
        i++;
    }
    return false;
}
export function isAxiomQuestionMark(seq: TreeSeq): boolean {
    const intersection = hugTreeSeq(seq);
    if(bottominGamma(seq)){
        return true;
    }
   
    let j = 0;
    while (j < intersection.length) {
        if (intersection[j].formula.type === "var") {
            return true;
        }
        j++;
    }
    let k = 0;
    while (k < intersection.length) {
        if (intersection[k].formula.type === "unary" && intersection[k].formula.op === "Box") {
            return true;
        }
        k++;
    }
    return false;
}

export function isStableQuestionMark(seq: TreeSeq): boolean {


    return isSaturatedQuestionMark(seq) && noBoxLeaves(seq);
}

export function isSaturatedQuestionMark(seq: TreeSeq): boolean {
    const intersection = hugTreeSeq(seq);
    if (intersection.length > 0) {
        return false;
    }
    if (bottominGamma(seq)) {
        return false;
    }

    if(!transitiveQuestionMark(seq)){
        return false;
    }
let i = 0;
    
    while (i < seq.Gamma.length) {
        if (seq.Gamma[i].formula.type === "op" && seq.Gamma[i].formula.op === "-->") {
        if (!seq.Gamma[i].divorced) {
            return false;
        }
    }
        i++;
    }

    while (i < seq.Delta.length) {
        if (seq.Delta[i].formula.type === "op" && seq.Delta[i].formula.op === "-->") {
        if (!seq.Delta[i].divorced) {
            return false;
        }
    }
        i++;
    }

    if(!isBoxPropogatedQuestionMark(seq)){
        return false;
    }

    

    
    
    return true;

}

export function transitiveQuestionMark(seq: TreeSeq): boolean {
    let i = 0;
    while (i < seq.Tel.length) {
        let j = 0;
        while (j < seq.Tel.length) {
            if (seq.Tel[i].to.label === seq.Tel[j].from.label) {
                let k = 0;
                let found = false;
                while (k < seq.Tel.length) {
                    if (seq.Tel[i].from.label === seq.Tel[k].from.label && seq.Tel[j].to.label === seq.Tel[k].to.label) {
                        found = true;
                        break;
                    }
                k++;
                }
                if (!found) {
                    return false;
                }
            }
            j++;
        }
        i++;
    }
    return true;
}

export function isBoxPropogatedQuestionMark(seq: TreeSeq): boolean {// i just check if y: box phi is in gamma and not y:phi 
    let i = 0;
    let j = 0;
    let k = 0;
   // let l = 0;
    while (i<seq.Tel.length) {
        const x = seq.Tel[i].from.label;
        const y = seq.Tel[i].to.label;
        j = 0;
        while (j < seq.Gamma.length) {
            if (seq.Gamma[j].world.label === x && seq.Gamma[j].formula.type === "unary" && seq.Gamma[j].formula.op === "Box") {
                while (k < seq.Gamma.length) {
                    if (seq.Gamma[k].world.label === y && JSON.stringify(seq.Gamma[k].formula) === JSON.stringify(seq.Gamma[j].formula)) {
                      // l++;
                    }
                    k++;
                }
                const formula: Expr = seq.Gamma[j].formula;
                if(formula.type === "unary"){
                    const innerFormula = formula.expr;
                    k = 0;
                    let found = false;
                    while(k < seq.Gamma.length){
                    if (seq.Gamma[k].world.label === y && JSON.stringify(seq.Gamma[k].formula) === JSON.stringify(innerFormula)) {
                        found = true;
                        break;
                    }
                    k++;
                }
                if(!found){
                    return false;
                }
                }
                
                
            }
            j++;
        }
        i++;


    }
    
        return true;
    
    
}

export function noBoxLeaves(seq: TreeSeq): boolean {
    let i = 0;
    while (i < seq.Delta.length){
        if(seq.Delta[i].formula.type === "unary" && seq.Delta[i].formula.op === "Box"){
            let worldLabel = seq.Delta[i].world.label;
            if(isLeafQuestionMark(seq, worldLabel)){
                return false;
            }
        }
        i++;

    }
    return true;
}

export function isLeafQuestionMark(seq: TreeSeq, worldLabel: string): boolean {
    let i = 0;
    while (i < seq.Tel.length) {
        if (seq.Tel[i].from.label === worldLabel) {
            return false;
        }        i++;
    }
    
    
    return true;
}



export function implicationLeftRule(input:labelledFormula): labelledFormula[] {
    if (input.formula.type === "op" && input.formula.op === "-->") {
        const world = input.world;
        const left = input.formula.left;
        const right = input.formula.right;  
        const formula1: labelledFormula = {arepresentation: `${world.label} : ${exprToString(left)}` , world, formula: left, divorced: false};
        const formula2: labelledFormula = { arepresentation: `${world.label} : ${exprToString(right)}` , world, formula: right, divorced: false};
        input.divorced = true;
        if(basic(formula1)){
            formula1.divorced = true;
        }
        if(basic(formula2)){
            formula2.divorced = true;
        }

        return [formula1, formula2];
    }
    throw new Error("Input formula is not an implication");
}

export function implicationRightRule(input:labelledFormula): labelledFormula[] {
    if (input.formula.type === "op" && input.formula.op === "-->") {
        const world = input.world;
        const left = input.formula.left;
        const right = input.formula.right;  
        const formula1: labelledFormula = { arepresentation: `${world.label} : ${exprToString(left)}` , world, formula: left, divorced: false};
        const formula2: labelledFormula = { arepresentation: `${world.label} : ${exprToString(right)}` , world, formula: right, divorced: false};
        input.divorced = true;
        if(basic(formula1)){
            formula1.divorced = true;
        }
        if(basic(formula2)){
            formula2.divorced = true;
        }
        return [formula1, formula2];
    }
    throw new Error("Input formula is not an implication");
}

export function leftBoxRules(input:labelledFormula, relation: relation): labelledFormula[] {
    if (input.formula.type === "unary" && input.formula.op === "Box") {
        const world = relation.to;
        const innerFormula = input.formula.expr;
        const formula1: labelledFormula = {  arepresentation: `${world.label} : ${exprToString(innerFormula)}` , world, formula: innerFormula, divorced: false};
        const formula2 = cloneLabelledFormula(input);
        formula2.world = world;
        formula2.divorced = false;
        formula2.arepresentation = `${world.label} : ${exprToString(input.formula.expr)}`;
       
        if(basic(formula1)){
            formula1.divorced = true;
        }
        if(basic(formula2)){
            formula2.divorced = true;
        }
        return [formula1, formula2];
    }
    throw new Error("Input formula is not a box formula");
}

export function worldToString(value: world): string {
    return value.label;
}

export function relationToString(value: relation): string {
    return `${worldToString(value.from)} R ${worldToString(value.to)}`;
}

export function labelledFormulaToString(value: labelledFormula): string {
    return `${worldToString(value.world)} : ${JSON.stringify(value.formula)}${value.divorced ? " (divorced)" : ""}`;
}

export function treeSeqToString(seq: TreeSeq): string {
    let result = "";
    result += "Tel:\n";
    for (const relation of seq.Tel) {
        result += `  ${relationToString(relation)}\n`;
    }
    result += "Gamma:\n";
    for (const formula of seq.Gamma) {
        result += `  ${labelledFormulaToString(formula)}\n`;
    }
    result += "------------------\n";
    result += "Delta:\n";

    for (const formula of seq.Delta) {
        result += `  ${labelledFormulaToString(formula)}\n`;
    }

    return result;
}



export function alreadyIN(relations: relation[], target: relation): boolean {
    for (const rel of relations) {
        if (rel.from.label === target.from.label && rel.to.label === target.to.label) {
            return true;
        }
    }
    return false;
}