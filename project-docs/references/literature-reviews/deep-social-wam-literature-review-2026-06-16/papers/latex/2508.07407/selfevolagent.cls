\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{selfevolagent}
\LoadClassWithOptions{article}

% Layout %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage[top=2cm, bottom=2.5cm, left=2.25cm, right=2.5cm, columnsep=0.65cm]{geometry}
\RequirePackage{microtype}
\RequirePackage{placeins}
\RequirePackage{hyphenat}
\RequirePackage{setspace}
\RequirePackage{parskip}
\RequirePackage[latin, english]{babel}
\RequirePackage{lipsum}
\RequirePackage{etoolbox}

\DisableLigatures[f]{family=sf*} 

% Graphics %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{graphicx}
\RequirePackage{subcaption}

% Tables %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{booktabs}
\RequirePackage{nicematrix}
\RequirePackage{multirow}
\RequirePackage{bm}

% Colorful stuff %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\RequirePackage[most]{tcolorbox}
\RequirePackage{xcolor}
\RequirePackage{colortbl}
\definecolor{selfevolagentpink}{HTML}{4b0082}
\definecolor{selfevolagentfg}{HTML}{1C2B33}
\definecolor{selfevolagentbg}{HTML}{fffafa}
\definecolor{commentcolor}{rgb}{0.294, 0, 0.51}
\definecolor{selfevolagent_dark}{HTML}{37D2A6} 
\definecolor{selfevolagent_light}{HTML}{9BE9D3}
\definecolor{selfevolagent_lighter}{HTML}{CDF4E9}
\definecolor{selfevolagent_blue}{HTML}{0064E0}

% References %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{hyperref}
\hypersetup{
  colorlinks,
  linkcolor=selfevolagent_blue,
  citecolor=selfevolagent_blue,
  urlcolor=selfevolagent_blue
}

\RequirePackage[round,authoryear]{natbib}
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
\DeclareCaptionFormat{custom}{{\textbf{#1 #2}} #3}
\captionsetup{singlelinecheck=false,format=custom,labelsep=custom,font=small}
\captionsetup[sub]{singlelinecheck=true,format=custom,labelsep=custom,font=small}

% Meta custom fonts %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% http://c.caignaert.free.fr/Install-ttf-Font.pdf
%\usepackage{txfonts}
\renewcommand*\ttdefault{cmvtt}
\RequirePackage[T1]{fontenc}

% % \pdfmapline{+optimistic < assets/Optimistic.ttf <T1-WGL4.enc}
% % \renewcommand{\sfdefault}{optimistic}

\DeclareFontFamily{T1}{optimistic}{}
\DeclareFontShape{T1}{optimistic}{m}{n}{<-> s * [0.88] assets/optimistic}{} 
\pdfmapline{+optimistic < assets/Optimistic.ttf <T1-WGL4.enc}
\renewcommand{\sfdefault}{optimistic}
% Use Times New Roman
%usepackage{newtxtext} % This sets the text font to Times New Roman
% \usepackage[T1]{fontenc} % Ensure proper font encoding
% \usepackage{lmodern} % Use Latin Modern for better T1 compatibility

% % Optional: Customize monospace font (if needed)
% \renewcommand*\ttdefault{cmvtt}

% % Set sans-serif font (if you want a specific Times-compatible sans-serif font)
%\renewcommand{\sfdefault}{ptm} % Use the 'ptm' family for sans-serif (Times-like sans-serif)
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
\newcommand\affiliationformat[2][]{{\normalsize $^{#1}$#2}}
\newcommand\affiliation[2][]{\addtolist[#1]{#2}{\affiliationlist}{\ttfamily\affiliationformat}{, }}

\newcommand\contactlist{}
\newcommand\contactformat[2][]{{\normalsize $^{#1}$#2}}
\newcommand\contact[2][]{\addtolist[#1]{#2}{\contactlist}{\ttfamily\contactformat}{, }}

\newcommand\contributionlist{}
\newcommand\contributionformat[2][]{{\small $^{#1}$#2}}
\newcommand\contribution[2][]{\addtolist[#1]{#2}{\contributionlist}{\contributionformat}{, }}

\newcommand\metadatalist{}
\newcommand\metadataformat[2][]{{\small {\sffamily \bfseries #1:} #2}}
\newcommand\metadata[2][]{\addtolist[#1]{#2}{\metadatalist}{\metadataformat}{\par}}

\renewcommand{\abstract}[1]{\def\abstractlist{{\color{selfevolagentfg} #1}}}
\newcommand{\email}[1]{\href{mailto:#1}{\texttt{#1}}}

\renewcommand\date[1]{\metadata[Date]{#1}}
\newcommand\correspondence[1]{\metadata[Correspondence]{#1}}

\renewcommand{\title}[1]{\newcommand{\titlelist}{{\huge\sffamily\bfseries #1}}}

\newcommand{\beginappendix}{\appendix{\huge\ttfamily Appendix\par}}

% Titlebox %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


\newcommand{\mymaketitle}{%
  \tcbset{enhanced,frame hidden}
  \tcbset{left=0.5cm}
  \tcbset{right=0.4cm}
  \tcbset{top=0.5cm}
  \tcbset{bottom=0.5cm}
  \tcbset{arc=10pt}
  \tcbset{colback=selfevolagent_light!20}
  \tcbset{before skip=0pt}
  \tcbset{grow to left by=1.5pt}
  \tcbset{grow to right by=1.5pt}
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
      \vskip 0.3cm
      %
      \authorlist\par
      \vskip 0.3cm
      %
      \affiliationlist\par
      \vskip 0.1cm
      %
      \contributionlist\par
    }
    %
    \abstractlist\par
    %
    \vskip 0.3cm
    %
    {
      \setlength{\parskip}{0.1cm}
      \ifdefempty{\metadatalist}{\vspace*{0.65cm}}{\centering\metadatalist\par}
    }
  \end{tcolorbox}
  \tcbset{reset}
  \FloatBarrier
}

\if@twocolumn%
\renewcommand{\maketitle}{
\twocolumn[%
  \mymaketitle
  \vskip 0.38cm
]
}%
\else%
\renewcommand{\maketitle}{
  \mymaketitle
}%
\fi
\tcbset{
    myquote/.style={
        colback=pink!20,   
        colframe=pink,     
        fonttitle=\bfseries,
        coltitle=black,
        boxrule=0.5mm,     % Border thickness
        sharp corners,     % No rounded corners
        left=1mm,          % Left padding
        right=1mm,         % Right padding
        top=1mm,           % Top padding
        bottom=1mm         % Bottom padding
    }
}