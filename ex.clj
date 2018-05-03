(defn add [elements e]
  (let [index (count (filter (fn [x] (< x e)) @elements))]
    (reset! elements (vec (concat (subvec @elements 0 index) [e] (subvec @elements index))))))
 
(defn remove [elements e]
  (reset! elements (vec (filter (fn [x] (not (.equals x e))) @elements))))
 
(defn intersect [elements otherElements]
  (let [result (atom [])
        aCount (count @elements)
        bCount (count @otherElements)]
    (def i (atom 0))
    (def j (atom 0))
    (while (and (< @i aCount) (< @j bCount)) (do
      (cond 
        (< (nth @elements @i) (nth @otherElements @j))
        (do (swap! i inc))
        (> (nth @elements @i) (nth @otherElements @j))
        (do (swap! j inc))
        (= (nth @elements @i) (nth @otherElements @j))
        (do (swap! result conj (nth @elements @i))
            (swap! i inc)
            (swap! j inc)))))
    @result))
 
(defn union [elements otherElements]
  (let [result (atom [])
        aCount (count @elements)
        bCount (count @otherElements)]
    (def i (atom 0))
    (def j (atom 0))
    (while (and (< @i aCount) (< @j bCount)) (do
      (cond 
        (= (nth @elements @i) (nth @otherElements @j))
        (do (swap! result conj (nth @elements @i))
            (swap! i inc)
            (swap! j inc))
        (> (nth @elements @i) (nth @otherElements @j))
        (do (swap! result conj (nth @elements @i))
          (swap! j inc))
        (< (nth @elements @i) (nth @otherElements @j))
        (do (swap! result conj (nth @elements @j))
            (swap! i inc)
            (swap! j inc)))))))
 
(defn toString [elements]
  (let [countsMap (reduce (fn [counts x] (assoc counts x (inc (get counts x 0)))) (hash-map) @elements)]
    (concat "Bag[" (clojure.string/join ", " (map (fn [x] (clojure.string/join ": " x)) countsMap)) "]")))
 
;--------------------
 
(def a (atom []))
(add a 2)
(add a 5)
(add a 3)
(add a 1)
(add a 1)
(add a 3)
(println @a)
(remove a 3)
(remove a 5)
(add a 6)
(remove a 4)
(println @a)
 
  ;(def ^:dynamic a [0 3])
  ;(def b ^:dynamic [1])
  ;(def a1 (add a 1))
  ;(def a2 (add a1 1))
  ;(def a3 (add a2 5))
  ;(def a4 (add a3 2))
  ;(println a4)
  ;(def a5 (removeAll a4 1))
  ;(def a6 (removeOne a4 1))
  ;(println a5)
  ;(println a6)
  ;(def b1 (add b 2))
  ;(def b2 (add b1 3))
  ;(def b3 (add b2 4))
  ;(def inter (intersect a4 b3))
  ;(println inter)
;(println (toString a4))
 