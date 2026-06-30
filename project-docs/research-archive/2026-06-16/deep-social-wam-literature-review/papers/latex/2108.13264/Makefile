p=neurips_2021
s=appendix
r=references

default:
	pdflatex $p.tex
	bibtex $p
	pdflatex $p.tex
	pdflatex $p.tex

sup:
	pdflatex $s.tex
	bibtex $r.bib
	pdflatex $s.tex
	pdflatex $s.tex

all:
	make default
	make sup

clean:
	rm -f *.log *.blg *.brf *.bbl *.aux *.dvi *.ps $p.pdf *~ *.out
