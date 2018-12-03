"use strict";

var DPAlgorithm_pkcanoical = Object.create(DPAlgorithm);

DPAlgorithm_pkcanoical.Description = "Recursion by Nussinov et al. (1978) with unique decomposition";
DPAlgorithm_pkcanoical.Tables = new Array();
DPAlgorithm_pkcanoical.Tables.push(Object.create(NussinovMatrix));
DPAlgorithm_pkcanoical.Tables[0].latex_representation = "D(i,j) = \\max \\begin{cases} D(i,j-1) & S_j \\text{ unpaired} \\\\ \\max_{i\\leq k< (j-l)} D(i,k-1)+D(k+1,j-1)+1 & \\text{if } S_k,S_j \\text{ compl. base pair} \\end{cases}";