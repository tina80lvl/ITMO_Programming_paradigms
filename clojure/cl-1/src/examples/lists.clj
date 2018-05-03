(ns multiset
  (require '[clojure.repl :refer :all])

  (def ms [])

  (defn equals
    [a b]
    (if (= a b)
      (true)
      (false)
      )
    )

  (defn add
    [e]
    (loop [i 0]
      (if (equals e (ms i))
        (concat ms e)
        )
      )
    )


  (defn -main []
    (add 1)
    (print ms)
    ))