engine = "pdflatex -interaction=nonstopmode --shell-escape %O %S"
refs = main.bib
sources = main.tex $(shell find . -type f -name '*.tex')

main.pdf: $(sources)
	@latexmk -pdf -pdflatex=${engine} -output-directory='output' -bibtex $<

watch:
	make; \
	(zathura output/main.pdf &); \
	while true; do \
		inotifywait -e modify -q $(sources); \
		make; \
	done
	# @while inotifywait -e modify $(refs) $(sources); do make; done

spell:
	@hunspell -l -t -d en_US -i utf-8 $(sources) \
		| sort \
		| uniq --ignore-case \
		| grep -vxFf dictionary.txt

clean:
	@latexmk -C
	rm main.bbl || true
	rm -rf output/*

pack:
	cp output/main.bbl main.bbl
	rm ../director.zip || true
	zip -r ../director.zip . -x '*.git*' -x 'output/*'
	# rm ../director.tar || true
	# tar -czvf ../director.tar --exclude .git --exclude output --exclude .gitignore  .

.PHONY: watch spell clean
