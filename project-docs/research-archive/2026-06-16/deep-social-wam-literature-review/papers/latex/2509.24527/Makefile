engine = "pdflatex -interaction=nonstopmode --shell-escape %O %S"
refs = main.bib
sources = main.tex $(shell find . -type f -name '*.tex')

main.pdf: $(sources)
	@latexmk -pdf -pdflatex=${engine} -output-directory='output' -bibtex $<

clean:
	@latexmk -C
	rm main.bbl || true
	rm -rf output/*

pack:
	cp output/main.bbl main.bbl
	rm ../dreamer4.zip || true
	zip -r ../dreamer4.zip . -x '*.git*' -x 'output/*'

.PHONY: watch spell clean
