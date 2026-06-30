% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% A new style for FAIR pre-prints
% Author: dlp@meta.com
% Version: 1.1
% %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Class declarations %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{fairmeta}
\LoadClassWithOptions{article}

% Layout %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage[top=2.25cm, bottom=2.5cm, left=2.5cm, right=2.5cm, columnsep=0.65cm]{geometry}
\RequirePackage{microtype}
\RequirePackage{placeins}
\RequirePackage{hyphenat}
\RequirePackage{setspace}
\RequirePackage{parskip}
\RequirePackage[latin, english]{babel}
\RequirePackage{lipsum}
\RequirePackage{etoolbox}
% \RequirePackage{svg}  % Disabled: not needed and can cause PDF version conflicts

\DisableLigatures[f]{family=sf*} 

% Graphics %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{graphicx}
\RequirePackage{subcaption}

% Tables %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{booktabs}
\RequirePackage{nicematrix}
\RequirePackage{multirow}
\RequirePackage{bm}
\newcommand{\nm}[1]{#1}

% Colorful stuff %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage[most]{tcolorbox}
\RequirePackage{xcolor}
\definecolor{metablue}{HTML}{0064E0}
\definecolor{metafg}{HTML}{1C2B33}
%\definecolor{metabg}{HTML}{F1F4F7}
% \definecolor{metabg}{HTML}{6633FF}
\definecolor{metabg}{HTML}{2A039B}

% fancy

\RequirePackage{fancyhdr}
\fancyhf{}

% Right header only (section or subsection)
% \leftmark = section, \rightmark = subsection
\fancyhead[R]{\leftmark}

% Optional: keep header rule
\renewcommand{\headrulewidth}{0.4pt}
\fancypagestyle{firstheader}{
	\fancyhf{}
	\fancyhead[R]{}
	\renewcommand{\headrulewidth}{0pt} % 
}
% References %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{hyperref}
\RequirePackage[noabbrev,nameinlink]{cleveref}
\hypersetup{
  colorlinks,
  linkcolor=metabg,
  citecolor=metabg,
  urlcolor=metabg
}

%\RequirePackage[square]{natbib}
\def\bibfont{\small}

% Section and caption format %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{titlesec}
\titleformat*{\paragraph}{\itshape}
\titleformat*{\section}{\Large\sffamily\bfseries}
\titleformat*{\subsection}{\large\sffamily\bfseries}
\titleformat*{\subsubsection}{\normalsize\sffamily\bfseries}
\DeclareTextFontCommand{\textbf}{\bfseries\sffamily}

\RequirePackage{caption}
\DeclareCaptionLabelSeparator{custom}{}
\DeclareCaptionFormat{custom}{{\sffamily\textbf{#1 #2}} #3}
\captionsetup{singlelinecheck=false,format=custom,labelsep=custom,font=small}
\captionsetup[sub]{singlelinecheck=true,format=custom,labelsep=custom,font=small}

% Meta custom fonts %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% http://c.caignaert.free.fr/Install-ttf-Font.pdf

% \renewcommand*\ttdefault{cmvtt}
\RequirePackage[T1]{fontenc}

% \pdfmapline{+optimistic < assets/Optimistic.ttf <T1-WGL4.enc}
% \renewcommand{\sfdefault}{optimistic}

\DeclareFontFamily{T1}{optimistic}{}
\DeclareFontShape{T1}{optimistic}{m}{n}{<-> s * [0.88] assets/optimistic}{}
\DeclareFontShape{T1}{optimistic}{b}{n}{<-> s * [0.88] assets/optimistic}{}
\pdfmapline{+optimistic < assets/Optimistic.ttf <T1-WGL4.enc}
\renewcommand{\sfdefault}{optimistic}

% Authors, affiliations, infos %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\renewcommand\addtolist[5][]{
  \begingroup
    \if\relax#3\relax\def\sep{}\else\def\sep{#5}\fi
    \let\protect\@unexpandable@protect 
    \xdef#3{\expandafter{#3}\sep #4[#1]{#2}}%
  \endgroup
}

\newcommand\authorlist{}
\newcommand\authorformat[2][]{{\sffamily \bfseries #2$^{#1}$}}
\renewcommand\author[2][]{\addtolist[#1]{#2}{\authorlist}{\authorformat}{, }}

\newcommand\affiliationlist{}
\newcommand\affiliationformat[2][]{{\small $^{#1}$#2}}
\newcommand\affiliation[2][]{\addtolist[#1]{#2}{\affiliationlist}{\affiliationformat}{ }}

\newcommand\contributionlist{}
\newcommand\contributionformat[2][]{{\small $^{#1}$#2}}
\newcommand\contribution[2][]{\addtolist[#1]{#2}{\contributionlist}{\contributionformat}{, }}

\newcommand\metadatalist{}
\newcommand\metadataformat[2][]{{\small {\sffamily \bfseries #1:} #2}}
\newcommand\metadata[2][]{\addtolist[#1]{#2}{\metadatalist}{\metadataformat}{\par}}

\renewcommand{\abstract}[1]{\def\abstractlist{{\color{metafg} #1}}}
\newcommand{\email}[1]{\href{mailto:#1}{\texttt{#1}}}

\renewcommand\date[1]{\metadata[Date]{#1}}
\newcommand\correspondence[1]{\metadata[Correspondence]{#1}}
\newcommand\Code[1]{\metadata[Code]{#1}}
\newcommand\github[1]{\metadata[Project page]{#1}}
\newcommand\hire[1]{\metadata[]{#1}}
\renewcommand{\title}[1]{\newcommand{\titlelist}{{\huge\sffamily\bfseries #1}}}
% 新增 Teaser 定义
\newcommand{\teaserlist}{}
\newcommand{\teaser}[1]{\renewcommand{\teaserlist}{#1}}

\newcommand{\beginappendix}{\appendix{\huge\sffamily Appendix\par}}

% Titlebox %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


\newcommand{\mymaketitle}{%
  \tcbset{enhanced,frame hidden}
  \tcbset{left=0.5cm}
  \tcbset{right=0.5cm}
  \tcbset{top=0.5cm}
  \tcbset{bottom=0.5cm}
  \tcbset{arc=5pt}
%  \tcbset{colback=metabg}
  % \tcbset{colback=metabg!10}
  \tcbset{before skip=0pt}
  \tcbset{grow to left by=1.5pt}
  \tcbset{grow to right by=1.5pt}
  \tcbset{overlay={\node[
    anchor=south east,
    at= (frame.south east),
    xshift=-0.5cm,
    yshift=0.2cm] {\includegraphics[width=1.8cm]{assets/alaya_simple.png}};
     \node[
     anchor=north east,
     at=(frame.north east),
     xshift=0.3cm,
     yshift=0.3cm
   ] {\includegraphics[width=0.6cm,angle=-45]{assets/game-controller-gray-right.png}};
   \node[
     anchor=north west,
     at=(frame.north west),
     xshift=-0.25cm,
     yshift=0.25cm
   ] {\includegraphics[width=0.55cm,angle=0]{assets/displayer.png}};
  % \node[
  %   anchor=south west,
  %   at=(frame.south west),
  %   xshift=-0.1cm,
  %   yshift=-0.4cm
  % ] {\includegraphics[width=0.6cm,angle=0]{assets/game-controller.png}};
  %  \node[
  %   anchor=south east,
  %   at=(frame.south east),
  %   xshift=0.1cm,
  %   yshift=-0.4cm
  % ] {\includegraphics[width=0.6cm,angle=0]{assets/game-controller.png}};
    }}
    
    
  % 
  \begin{tcolorbox}
    \setlength{\parindent}{0cm}
    \setlength{\parskip}{0.5cm}
    {
      \setlength{\parskip}{0cm}
      \raggedright
      \nohyphens
      %
      {
        \setstretch{1.618}
        
        \titlelist\par
      }
      \vskip 0.2cm
      %
      {\color{metabg}\authorlist}\par
      \vskip 0.2cm
      %
      {\color{metabg}\affiliationlist}\par
      %
      {\color{metabg}\contributionlist}\par
    }
    %
    %
    % --- 新增代码开始 ---
    \ifdefempty{\teaserlist}{}{
      \begin{center}
        \teaserlist
      \end{center}
      \vskip 0.5cm
    }
    % --- 新增代码结束 ---
    %
    
    %
    \abstractlist\par
    %
    \vskip 0.5cm
    {
      \setlength{\parskip}{0cm}
      \ifdefempty{\metadatalist}{\vspace*{0.65cm}}{\metadatalist\par}
    }
  \end{tcolorbox}
  \tcbset{reset}
  \FloatBarrier
}

\if@twocolumn%
\renewcommand{\maketitle}{
\twocolumn[%
  \mymaketitle
  \vskip 0.3cm
]
}%
\else%
\renewcommand{\maketitle}{
  \mymaketitle
}%
\fi
