1. Install & Load Libraries
        install.packages("arules") == used for mining association rules and frequent itemsets.
        install.packages("arulesViz")  == For visualization/graph
        library(arules)
        library(arulesViz)
        library(readxl) === to tell our R to read the excel file we imported
        View(cosmetics) ==== to view our dataset if is imported

2. To Run apriori algorith 
apriori is used to mine rules
    rules <- apriori(cosmetics,parameter = list(supp = 0.07, minlen = 2, maxlen=3))
    summary(rules) ==== To View summary of the rules

3. Visualization/graph
    plot(rules) == normal plot or graph
    plot(rules, method="graph", control=list(type="items")) === Graph-based visualization

4. The main factors that determine interpretation are;
  i. Support - fraction/proportion of transactions containing the itemset.
  ii. Confidence (predictive accuracy) - measure of how often items in Y appear in transaction than X
  iii. Lift (strength of association beyond chance)











  