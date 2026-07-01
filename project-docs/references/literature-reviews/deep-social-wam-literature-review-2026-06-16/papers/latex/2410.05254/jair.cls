\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{jair}[2025/08/15 JAIR class extending acmart]

% Pass unknown options to acmart
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{acmart}}
\ProcessOptions\relax

% Load acmart with default options
\LoadClass[acmlarge,natbib=false,screen]{acmart}

% --- JAIR Customizations ---
\RequirePackage{textcase}

\usepackage[
    type={CC},
    modifier={by},
    version={4.0},
    imagemodifier={-88x31},
    % imagemodifier={-80x15},
]{doclicense}

% Optional: remove ACM reference formatting
% \settopmatter{printacmref=false}

\def\@journalName{Journal of Artificial Intelligence Research}%
\def\@journalNameShort{JAIR}%
\def\@permissionCodeOne{XXXX}%
\def\@permissionCodeTwo{XXXX}%

%% Rights management information.  This information is sent to you
%% when you complete the rights form.  These commands have SAMPLE
%% values in them; it is your responsibility as an author to replace
%% the commands and values with those provided to you when you
%% complete the rights form.

%% JAIR Copyright Block, do Not Change

\gdef\@copyrightpermission{
  \begin{minipage}{0.2\columnwidth}
   \href{https://creativecommons.org/licenses/by/4.0/}{\doclicenseImage}
  \end{minipage}\hfill
  \begin{minipage}{0.8\columnwidth}
   \href{https://creativecommons.org/licenses/by/4.0/}{This work is licensed under a Creative Commons Attribution International 4.0 License.}
  \end{minipage}
  \vspace{5pt}
}

\def\@formatdoi#1{\textsc{doi:} \href{https://doi.org/#1}{#1}}

\renewcommand{\orcid}[2][]{%
  \unskip\ignorespaces
  \IfBeginWith{#2}{http}{%
  % TODO: warn or error just to include xxxx-xxxx-xxxx-xxxx number.
    \if@ACM@anonymous\else
      \g@addto@macro\addresses{\orcid{#2}{#2}}%
    \fi
  }{%
    \if@ACM@anonymous\else
      \g@addto@macro\addresses{\orcid{https://orcid.org/#2}{#2}}%
    \fi
  }%
}


%% Jair AE and Track
\def\JAIRAE#1{\def\@JAIRAE{#1}}
\JAIRAE{Insert JAIR AE Name}
\def\JAIRTrack#1{\def\@JAIRTrack{#1}}
\JAIRTrack{Insert JAIR Track Name Here}

\def\@secfont{\sffamily\bfseries\large\section@raggedright}
\def\@subsecfont{\sffamily\bfseries\large\section@raggedright}

\def\@mkauthors@i{%
  \def\@currentauthors{}%
  \def\@currentaffiliations{}%
  \global\let\and\@typeset@author@line
  \def\@author##1{%
    \ifx\@currentauthors\@empty
      \gdef\@currentauthors{\@authorfont\MakeTextUppercase{##1}}%
    \else
       \g@addto@macro{\@currentauthors}{\and\MakeTextUppercase{##1}}%
    \fi
    \gdef\and{}}%
  \def\email##1##2{}%
  \def\orcid##1##2{}%
  \def\affiliation##1##2{%
    \def\@tempa{##2}\ifx\@tempa\@empty\else
       \ifx\@currentaffiliations\@empty
          \gdef\@currentaffiliations{%
            \setkeys{@ACM@affiliation@}{obeypunctuation=false}%
            \setkeys{@ACM@affiliation@}{##1}%
            \@ACM@resetaffil
            \@affiliationfont##2\@ACM@checkaffil}%
       \else
         \g@addto@macro{\@currentaffiliations}{\and
           \setkeys{@ACM@affiliation@}{obeypunctuation=false}%
           \setkeys{@ACM@affiliation@}{##1}\@ACM@resetaffil
           ##2\@ACM@checkaffil}%
      \fi
    \fi
     \global\let\and\@typeset@author@line}%
  \if@ACM@acmcp
    \advance\hsize by -6pc%
  \fi
  \global\setbox\mktitle@bx=\vbox{\noindent\unvbox\mktitle@bx\par\medskip
    \noindent\addresses\@typeset@author@line
   \par\medskip}%
}
\newbox\author@bx
\newdimen\author@bx@wd
\newskip\author@bx@sep
\author@bx@sep=1pc\relax
\def\@typeset@author@bx{\bgroup\hsize=\author@bx@wd
  \def\and{\par}\normalbaselines
  \global\setbox\author@bx=\vtop{\if@ACM@sigchiamode\else\centering\fi
    \@authorfont\@currentauthors\par\@affiliationfont
    \@currentaffiliation}\egroup
  \box\author@bx\hspace{\author@bx@sep}%
  \gdef\@currentauthors{}%
  \gdef\@currentaffiliation{}}
\def\@mkauthors@iii{%
  \author@bx@wd=\textwidth\relax
  \advance\author@bx@wd by -\author@bx@sep\relax
  \ifnum\@ACM@authorsperrow>0\relax
    \divide\author@bx@wd by \@ACM@authorsperrow\relax
  \else
    \ifcase\num@authorgroups
    \relax % 0?
    \or  % 1=one author per row
    \or  % 2=two authors per row
       \divide\author@bx@wd by \num@authorgroups\relax
    \or  % 3=three authors per row
       \divide\author@bx@wd by \num@authorgroups\relax
    \or  % 4=two authors per row (!)
       \divide\author@bx@wd by 2\relax
    \else % three authors per row
       \divide\author@bx@wd by 3\relax
    \fi
  \fi
  \advance\author@bx@wd by -\author@bx@sep\relax
  \gdef\@currentauthors{}%
  \gdef\@currentaffiliation{}%
  \def\@author##1{\ifx\@currentauthors\@empty
    \gdef\@currentauthors{\par##1}%
  \else
    \g@addto@macro\@currentauthors{\par##1}%
  \fi
  \gdef\and{}}%
  \def\email##1##2{\ifx\@currentaffiliation\@empty
    \gdef\@currentaffiliation{\bgroup
      \mathchardef\UrlBreakPenalty=10000\nolinkurl{##2}\egroup}%
  \else
    \g@addto@macro\@currentaffiliation{\par\bgroup
      \mathchardef\UrlBreakPenalty=10000\nolinkurl{##2}\egroup}%
  \fi}%
  \def\orcid##1##2{\ifx\@currentaffiliation\@empty
    \gdef\@currentaffiliation{\bgroup
      \mathchardef\UrlBreakPenalty=10000\nolinkurl{##2}\egroup}%
  \else
    \g@addto@macro\@currentaffiliation{\par\bgroup
      \mathchardef\UrlBreakPenalty=10000\nolinkurl{##2}\egroup}%
  \fi}%
  \def\affiliation##1##2{\ifx\@currentaffiliation\@empty
    \gdef\@currentaffiliation{%
      \setkeys{@ACM@affiliation@}{obeypunctuation=false}%
      \setkeys{@ACM@affiliation@}{##1}\@ACM@resetaffil
      ##2\@ACM@checkaffil}%
  \else
    \g@addto@macro\@currentaffiliation{\par
      \setkeys{@ACM@affiliation@}{obeypunctuation=false}%
      \setkeys{@ACM@affiliation@}{##1}\@ACM@resetaffil
      ##2\@ACM@checkaffil}%
  \fi
  \global\let\and\@typeset@author@bx
}%
  \hsize=\textwidth
  \global\setbox\mktitle@bx=\vbox{\noindent
    \unvbox\mktitle@bx\par\medskip\leavevmode
    \lineskip=1pc\relax\centering\hspace*{-1em}%
    \addresses\let\and\@typeset@author@bx\and\par\bigskip}}
\def\@mkauthors@iv{%
  \author@bx@wd=\columnwidth\relax
  \advance\author@bx@wd by -\author@bx@sep\relax
  \ifnum\@ACM@authorsperrow>0\relax
    \divide\author@bx@wd by \@ACM@authorsperrow\relax
  \else
    \ifcase\num@authorgroups
    \relax % 0?
    \or  % 1=one author per row
    \else  % 2=two authors per row
       \divide\author@bx@wd by 2\relax
    \fi
  \fi
  \advance\author@bx@wd by -\author@bx@sep\relax
  \gdef\@currentauthors{}%
  \gdef\@currentaffiliation{}%
  \def\@author##1{\ifx\@currentauthors\@empty
    \gdef\@currentauthors{\par##1}%
  \else
    \g@addto@macro\@currentauthors{\par##1}%
  \fi
  \gdef\and{}}%
  \def\email##1##2{\ifx\@currentaffiliation\@empty
    \gdef\@currentaffiliation{\nolinkurl{##2}}%
  \else
    \g@addto@macro\@currentaffiliation{\par\nolinkurl{##2}}%
  \fi}%
  \def\orcid##1##2{\ifx\@currentaffiliation\@empty
    \gdef\@currentaffiliation{\nolinkurl{##2}}%
  \else
    \g@addto@macro\@currentaffiliation{\par\nolinkurl{##2}}%
  \fi}%
  \def\affiliation##1##2{\ifx\@currentaffiliation\@empty
    \gdef\@currentaffiliation{%
      \setkeys{@ACM@affiliation@}{obeypunctuation=false}%
      \setkeys{@ACM@affiliation@}{##1}\@ACM@resetaffil
      ##2\@ACM@checkaffil}%
  \else
    \g@addto@macro\@currentaffiliation{\par
      \setkeys{@ACM@affiliation@}{obeypunctuation=false}%
      \setkeys{@ACM@affiliation@}{##1}\@ACM@resetaffil
      ##2\@ACM@checkaffil}%
  \fi
  \global\let\and\@typeset@author@bx}%
    \bgroup\hsize=\columnwidth
    \par\raggedright\leftskip=\z@
    \lineskip=1pc\noindent
    \addresses\let\and\@typeset@author@bx\and\par\bigskip\egroup}
\def\@mkauthorsaddresses{%
  \ifnum\num@authors>1\relax
  Authors' \else Author's \fi
  Contact Information:
  \bgroup
  \def\streetaddress##1{\ClassWarning{\@classname}{ACM no longer collects
  authors' postal addresses.  I am ignoring your street
  address}\unskip\ignorespaces}%
  \def\postcode##1{\ClassWarning{\@classname}{ACM no longer collects
  authors' postal addresses.  I am ignoring your postal
  code}\unskip\ignorespaces}%
  \def\position##1{\unskip\ignorespaces}%
  \gdef\@ACM@institution@separator{, }%
  \def\institution##1{\unskip\@ACM@institution@separator ##1\gdef\@ACM@institution@separator{ and }}%
  \def\city##1{\unskip, ##1}%
  \def\state##1{\unskip, ##1}%
  \renewcommand\department[2][0]{\unskip\@addpunct, ##2}%
  \def\country##1{\unskip, ##1}%
  \def\and{\unskip; \gdef\@ACM@institution@separator{, }}%
  \def\@author##1{##1}%
  \def\email##1##2{\unskip, \nolinkurl{##2}}%
  \def\orcid##1##2{\unskip, \textsc{orcid:} \href{##1}{##2}}%
  \addresses
  \egroup}


\def\@mkbibcitation{\bgroup
  \let\@vspace\@vspace@orig
  \let\@vspacer\@vspacer@orig
  \def\@pages@word{\ifnum\getrefnumber{TotPages}=1\relax page\else pages\fi}%
  \def\footnotemark{}%
  \def\\{\unskip{} \ignorespaces}%
  \def\footnote{\ClassError{\@classname}{Please do not use footnotes
      inside a \string\title{} or \string\author{} command! Use
      \string\titlenote{} or \string\authornote{} instead!}}%
  \def\@article@string{\ifx\@acmArticle\@empty{\ }\else,
    Article~\@acmArticle\ \fi}% %% NSM JAIR REFERENCE FORMAT
  \ifx\@JAIRTrack\@empty\else
    \par\medskip\small\noindent{\bfseries JAIR Track:} \@JAIRTrack
  \fi
  \par\medskip\small\noindent{\bfseries JAIR Associate Editor:} \@JAIRAE  
  \par\medskip\small\noindent{\bfseries JAIR Reference Format:}\par\nobreak
  \noindent\bgroup
    \def\\{\unskip{}, \ignorespaces}\authors\egroup. \@acmYear. \@title
  \ifx\@subtitle\@empty. \else: \@subtitle. \fi
  \if@ACM@nonacm\else
    % The 'nonacm' option disables 'printacmref' by default,
    % and the present \@mkbibcitation definition is never used
    % in this case. The conditional remains useful if the user
    % explicitly sets \settopmatter{printacmref=true}.
    \if@ACM@journal@bibstrip
       \textit{\@journalName}
    \@acmVolume \@article@string (\@acmPubDate),
       \ref{TotPages}~\@pages@word.
    \else
       In \textit{\@acmBooktitle}%
       \ifx\@acmEditors\@empty\textit{.}\else
         \andify\@acmEditors\textit{, }\@acmEditors~\@editorsAbbrev.%
       \fi\
       ACM, New York, NY, USA%
         \@article@string\unskip, \ref{TotPages}~\@pages@word.
    \fi
  \fi
  \ifx\@acmDOI\@empty\else\@formatdoi{\@acmDOI}\fi
\par\egroup}  

\AtBeginDocument{%
  \if@ACM@nonacm\else
    \fancyfoot{}
    \fancyfoot[RO,LE]{\footnotesize \@journalName, Vol.
        \@acmVolume, Article \@acmArticle.  Publication date: \@acmPubDate.}%

    \fancypagestyle{firstpagestyle}{%
      \fancyhf{}%
      \fancyfoot[RO,LE]{\footnotesize \@journalName, Vol.
        \@acmVolume, Article \@acmArticle. Publication date: \@acmPubDate.}%
    }%
  \fi
}

\def\maketitle{\@beginmaketitlehook
  \@ACM@maketitle@typesettrue
  \if@ACM@anonymous
    % Anonymize omission of \author-s
    \ifnum\num@authorgroups=0\author{}\fi
  \fi
  \begingroup
  \let\@vspace\@vspace@orig
  \let\@vspacer\@vspacer@orig
  \let\@footnotemark\@footnotemark@nolink
  \let\@footnotetext\@footnotetext@nolink
  \renewcommand\thefootnote{\@fnsymbol\c@footnote}%
  \hsize=\textwidth
  \def\@makefnmark{\hbox{\@textsuperscript{\@thefnmark}}}%
  \@mktitle\if@ACM@sigchiamode\else\@mkauthors\fi\@mkteasers
  \@printtopmatter
  \if@ACM@sigchiamode\@mkauthors\fi
  \setcounter{footnote}{0}%
  \def\@makefnmark{\hbox{\@textsuperscript{\normalfont\@thefnmark}}}%
  \@titlenotes
  \@subtitlenotes
  \@authornotes
  \let\@makefnmark\relax
  \let\@thefnmark\relax
  \let\@makefntext\noindent
  \ifx\@empty\thankses\else
    \footnotetextauthorsaddresses{%
      \def\par{\let\par\@par}\parindent\z@\@setthanks}%
  \fi
  \if@ACM@acmcp\else
    \ifx\@empty\@authorsaddresses\else
       \if@ACM@anonymous\else
         \if@ACM@journal@bibstrip@or@tog
           \footnotetextauthorsaddresses{%
             \def\par{\let\par\@par}\parindent\z@\@setauthorsaddresses}%
         \fi
       \fi
    \fi
  \fi
  \if@ACM@nonacm
    \ifnum\acm@copyrightmode=15\relax % cc
       \footnotetextcopyrightpermission{\@copyrightpermission}%
    \fi
  \else
    \if@ACM@acmcp\else
    \footnotetextcopyrightpermission{%
    \if@ACM@authordraft
        \raisebox{-2ex}[\z@][\z@]{\makebox[0pt][l]{\large\bfseries
            Unpublished working draft. Not for distribution.}}%
       \color[gray]{0.9}%
    \fi
    \parindent\z@\parskip0.1\baselineskip
    \if@ACM@authorversion\else
      \if@printpermission\@copyrightpermission\par\fi
    \fi
    \if@ACM@manuscript\else
       \if@ACM@journal@bibstrip\else % Print the conference information
         \if@ACM@engage
            {\itshape \@acmBooktitle, \@acmYear.}\par
         \else
         {\itshape \acmConference@shortname, \acmConference@venue}\par
         \fi
       \fi
    \fi
    \if@printcopyright
      \copyright\ \@copyrightyear\ \@copyrightowner\\
    \else
      \ifx\@copyrightyear\@empty\else
        \@copyrightyear.\
      \fi
    \fi
    \if@ACM@manuscript
      Manuscript submitted to ACM\\
    \else
      \if@ACM@authorversion
          This is the author's version of the work. It is posted here for
          your personal use. Not for redistribution. The definitive Version
          of Record was published in
          \if@ACM@journal@bibstrip
            \emph{\@journalName}%
          \else
            \emph{\@acmBooktitle}%
          \fi
          \ifx\@acmDOI\@empty
          .
          \else
            , \@formatdoi{\@acmDOI}.
          \fi\\
        \else
          \if@ACM@nonacm\else
            \if@ACM@journal@bibstrip
              \@formatdoi{\@acmDOI}%
            \else % Conference
              \ifx\@acmISBN\@empty\else ACM~ISBN~\@acmISBN\\\fi
              \ifx\@acmDOI\@empty\else\@formatdoi{\@acmDOI}\fi%
            \fi
          \fi
        \fi
      \fi}%
    \fi
    \fi
  \endgroup
  \if@ACM@engage\@typesetengagemetadata\fi
  \setcounter{footnote}{0}%
  \@mkabstract
  \ifx\@translatedabstracts\@empty\else
  \@translatedabstracts\fi
  \if@ACM@printccs
  \ifx\@concepts\@empty\else\bgroup
      {\@specialsection{CCS Concepts}%
         \noindent\@concepts\par}\egroup
     \fi
   \fi
   \if@ACM@acmcp\else
     \ifx\@keywords\@empty\else\bgroup
        {\@specialsection{\keywordsname}%
           \noindent\@keywords\par}\egroup
     \fi
    \ifx\@translatedkeywords\@empty\else
       \@translatedkeywords
    \fi
  \fi
  \let\metadata@authors=\authors
  \nxandlist{, }{, }{, }\metadata@authors
  \def\@ACM@checkaffil{}%
  \hypersetup{%
    pdfauthor={\metadata@authors},
    pdftitle={\@title},
    pdfsubject={\@concepts},
    pdfkeywords={\@keywords},
    pdfcreator={LaTeX with acmart
      \csname ver@\@classname.cls\endcsname\space
      and hyperref
      \csname ver@hyperref.sty\endcsname}}%
  \andify\authors
  \andify\shortauthors
  \global\let\authors=\authors
  \global\let\shortauthors=\shortauthors
  \if@ACM@printacmref
     \@mkbibcitation
  \fi
  \global\@topnum\z@ % this prevents floats from falling
                     % at the top of page 1
  \global\@botnum\z@ % we do not want them to be on the bottom either
  \@printendtopmatter
  \@afterindentfalse
  \@afterheading
  \if@ACM@acmcp
    \set@ACM@acmcpbox
    \AtEndDocument{\end@ACM@color@frame}%
    \@ACM@color@frame
  \fi
}
