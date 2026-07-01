p=main
all: $p.pdf

clean:
	rm -f *~ *.bak *.bbl *.aux *.log *.dvi $p.pdf *.ps *.blg *.out

$p.pdf: $p.tex $p.bib
	pdflatex $p.tex
	bibtex $p
	pdflatex $p.tex
	pdflatex $p.tex
