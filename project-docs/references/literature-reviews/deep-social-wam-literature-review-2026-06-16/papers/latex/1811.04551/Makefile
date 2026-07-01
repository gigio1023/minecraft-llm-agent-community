engine = "pdflatex -interaction=nonstopmode --shell-escape %O %S"
refs = main.bib
sources = main.tex $(wildcard sections/*.tex)
output = 'output'

main.pdf: $(sources)
	@latexmk -pdf -pdflatex=${engine} -output-directory='$(output)' -bibtex $<

watch:
	@while ! inotifywait --event modify $(refs) $(sources); do make; done

spell:
	@hunspell -l -t -d en_US -i utf-8 $(sources) \
		| sort \
		| uniq --ignore-case \
		| grep -vxFf dictionary.txt

clean:
	@latexmk -C
	rm -rf $(output)/*

pack:
	rm ../planet.tar || true
	cp output/main.bbl main.bbl
	tar -czvf ../planet.tar --exclude .git --exclude .gitignore --exclude *.log --exclude output .

.PHONY: watch spell clean
