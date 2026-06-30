\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{nextgame2026}[2026/04/11 v1.0 NExT-Game 2026 Style File]
% v2026; Adjusted from DynaFront (NeurIPS) workshop style: T. Chavdarova
% v2025; Adjusted from OPT (NeurIPS) workshop style: T. Chavdarova, A. Wibisono
% v2025: S. Stich
% v2024: S. Stich
% v2023: S. Stich
% v2022: S. Stich
% v2021: S. Stich
% v2020: S. Stich
% v2019: S. Stich

\@ifundefined{ifanonsubmission}{
  \newif\ifanonsubmission
  \anonsubmissionfalse
}{}

\@ifundefined{iffinalsubmission}{
  \newif\iffinalsubmission
  \finalsubmissionfalse
}{}

\DeclareOption{anon}{\anonsubmissiontrue}
\DeclareOption{final}{\finalsubmissiontrue}
\ProcessOptions\relax

\LoadClass[wcp]{jmlr}

% modified so that header doesn't appear
\jmlrvolume{}
\jmlryear{}
\jmlrproceedings{wcp}{NExT-Game 2026: New Frontiers in Game-Theoretic Learning -- ICML 2026 Workshop}


\ifanonsubmission
 \newcommand{\optauthor}[1]{}
 \author{author names withheld\\[2em] Under Review for NExT-Game 2026}
 \jmlrworkshop{}
 \renewcommand{\acks}[1]{}
\else
 \newcommand{\optauthor}[1]{\author{#1}}
 \iffinalsubmission
  \editors{}
  \jmlrworkshop{}
 \fi
\fi

% patch for includegraphics not working with newer latex versions
\makeatletter
 \let\Ginclude@graphics\@org@Ginclude@graphics
\makeatother
