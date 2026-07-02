"""
Topic Database - Predefined learning information for gap categories.

This database provides structured learning information for each gap category identified in interview analysis.
Each topic includes concept definition, subtopics, required competencies, and common pitfalls to avoid.

This information is NOT LLM-generated on-demand, but predefined to ensure consistency across all candidates.
"""

TOPIC_DATABASE = {
    "System Design": {
        "concept": "The process of designing distributed systems that are scalable, reliable, and maintainable. System design involves understanding trade-offs between different architectural approaches, capacity planning, and making decisions about technology choices based on requirements and constraints.",
        "subtopics": [
            "Load Balancing & Traffic Distribution",
            "Caching Strategies (Redis, CDN, Application-level)",
            "Database Scaling (Sharding, Replication, Consistency Models)",
            "API Design & REST Principles",
            "Microservices vs Monolith Trade-offs",
            "Message Queues & Asynchronous Processing",
            "NoSQL vs Relational Databases",
            "Content Delivery Networks (CDN)",
            "Rate Limiting & Throttling",
            "Monitoring, Logging, and Alerting"
        ],
        "competencies": [
            "Understanding CAP theorem and consistency models (eventual, strong, weak)",
            "Ability to estimate scale (QPS, storage, bandwidth)",
            "Database design under constraints (sharding strategies, replication)",
            "Architectural trade-offs (latency vs consistency, availability vs partition tolerance)",
            "Communication of architectural decisions and rationale",
            "Knowledge of common system design patterns (MVC, pub-sub, request-response)",
            "Understanding of network fundamentals (latency, throughput, packet loss)"
        ],
        "pitfalls": [
            "Designing for current scale instead of 10x scale",
            "Ignoring network latency in distributed designs",
            "Overcomplicating early (YAGNI principle)",
            "Not clarifying requirements and constraints before designing",
            "Failing to communicate trade-offs made",
            "Choosing technologies without considering operational complexity",
            "Not considering single points of failure",
            "Underestimating storage and bandwidth requirements"
        ]
    },
    
    "Algorithms": {
        "concept": "The study of computational problem-solving techniques including sorting, searching, graph traversal, and dynamic programming. Algorithms are fundamental to computer science and interviews assess your ability to write efficient solutions, analyze complexity, and optimize under constraints.",
        "subtopics": [
            "Big-O Notation & Complexity Analysis",
            "Sorting Algorithms (Merge Sort, Quick Sort, Heap Sort, Radix Sort)",
            "Searching & Binary Search Applications",
            "Data Structures (Arrays, Linked Lists, Trees, Graphs, Hash Tables, Heaps)",
            "Dynamic Programming Fundamentals",
            "Graph Algorithms (BFS, DFS, Dijkstra, Topological Sort, Minimum Spanning Tree)",
            "Backtracking and Recursion",
            "Greedy Algorithms",
            "String Manipulation and Pattern Matching",
            "Two-Pointer and Sliding Window Techniques"
        ],
        "competencies": [
            "Analyzing time and space complexity of algorithms",
            "Choosing appropriate data structures for different problems",
            "Recognizing dynamic programming problems and defining subproblems",
            "Implementing and explaining algorithms from scratch",
            "Optimizing from brute force to efficient solutions",
            "Understanding trade-offs between time and space complexity",
            "Identifying patterns and applying known solutions",
            "Testing with multiple examples and edge cases"
        ],
        "pitfalls": [
            "Not analyzing complexity before or after coding",
            "Choosing inefficient data structures",
            "Failing to handle edge cases (empty input, single element, duplicates, negatives)",
            "Not testing with multiple examples before submitting",
            "Overcomplicating solutions when a simpler approach exists",
            "Forgetting to consider memory constraints",
            "Implementing inefficient nested loops when better approaches exist",
            "Not optimizing after getting a working solution"
        ]
    },
    
    "Code Quality": {
        "concept": "The practice of writing code that is readable, maintainable, efficient, and correct. Code quality encompasses naming conventions, proper structure, error handling, and writing code that other developers (or yourself in the future) can easily understand and modify.",
        "subtopics": [
            "Meaningful Variable and Function Naming",
            "Code Organization and Structure",
            "Error Handling and Exception Management",
            "Code Documentation and Comments",
            "DRY Principle (Don't Repeat Yourself)",
            "SOLID Principles",
            "Testing and Test-Driven Development",
            "Refactoring Techniques",
            "Performance Optimization",
            "Security Considerations"
        ],
        "competencies": [
            "Writing self-documenting code with clear naming",
            "Proper indentation and formatting",
            "Adding meaningful comments only where necessary",
            "Handling errors gracefully with appropriate exceptions",
            "Refactoring code step-by-step for readability",
            "Understanding and applying SOLID principles",
            "Writing testable code",
            "Using appropriate design patterns"
        ],
        "pitfalls": [
            "Using cryptic variable names (x, tmp, data)",
            "Writing code that only you understand",
            "Ignoring error cases and edge cases",
            "Over-commenting obvious code",
            "Duplicating code instead of extracting to functions",
            "Not considering maintainability of code",
            "Writing monolithic functions instead of breaking them down",
            "Leaving debug code or print statements in submissions"
        ]
    },
    
    "Following Instructions": {
        "concept": "The ability to understand problem requirements, ask clarifying questions, follow constraints, and deliver exactly what was asked. Following instructions is critical in interviews because it demonstrates attention to detail, communication skills, and the ability to work with requirements.",
        "subtopics": [
            "Active Problem Reading and Understanding",
            "Clarifying Questions and Requirements",
            "Constraint Identification and Verification",
            "Example Walkthrough and Testing",
            "Delivering What Was Asked For",
            "Handling Requirement Changes",
            "Confirming Understanding Before Coding",
            "Systematic Edge Case Verification"
        ],
        "competencies": [
            "Carefully reading and understanding problem statements",
            "Asking clarifying questions to remove ambiguity",
            "Identifying and noting all constraints (input format, output format, time/space limits)",
            "Restating requirements in your own words",
            "Tracing through provided examples to verify understanding",
            "Confirming edge cases and boundary conditions",
            "Testing solution against all provided examples before submitting",
            "Adapting when requirements change during the interview"
        ],
        "pitfalls": [
            "Jumping to code without understanding the problem fully",
            "Missing subtle details in the problem statement",
            "Not asking for clarification when unclear",
            "Assuming edge cases that weren't mentioned",
            "Writing code for a different problem than was asked",
            "Not testing with all provided examples",
            "Ignoring stated constraints",
            "Not confirming understanding before starting to code"
        ]
    },
    
    "Communication": {
        "concept": "The ability to articulate thoughts clearly, structure answers logically, listen actively, and engage confidently in conversation. Communication in interviews is crucial because it demonstrates your ability to work in teams, explain complex ideas, and collaborate effectively.",
        "subtopics": [
            "Clarity and Conciseness",
            "Logical Structure and Organization",
            "Active Listening",
            "Confidence and Presence",
            "Technical Vocabulary Usage",
            "STAR Method for Behavioral Questions",
            "Handling Silence and Pauses",
            "Asking Clarifying Questions",
            "Trade-off Communication",
            "Summarization and Synthesis"
        ],
        "competencies": [
            "Expressing complex ideas in simple, clear language",
            "Structuring answers with clear beginning, middle, and end",
            "Listening actively and responding to interviewer's feedback",
            "Speaking confidently without excessive hedging or filler words",
            "Using appropriate technical terminology",
            "Organizing behavioral answers using STAR framework",
            "Knowing when to pause vs speak",
            "Asking meaningful follow-up questions",
            "Explicitly stating trade-offs when proposing solutions",
            "Summarizing key points concisely"
        ],
        "pitfalls": [
            "Rambling without clear structure or conclusions",
            "Using excessive filler words (um, uh, like, you know)",
            "Going silent for extended periods while thinking",
            "Speaking too quickly or unclearly",
            "Not listening to interviewer's hints and feedback",
            "Using jargon without explanation",
            "Failing to support claims with specific examples",
            "Not asking clarifying questions",
            "Proposing solutions without discussing trade-offs",
            "Giving overly technical or overly simple answers"
        ]
    },
    
    "Problem Solving": {
        "concept": "The systematic approach to breaking down complex problems, identifying patterns, developing solutions, and iterating to find optimal answers. Problem-solving in interviews assesses your ability to think critically, manage complexity, and work through challenges methodically.",
        "subtopics": [
            "Problem Decomposition",
            "Pattern Recognition",
            "Constraint Analysis",
            "Brute Force to Optimized Solutions",
            "Trade-off Analysis",
            "Edge Case Identification",
            "Validation and Testing",
            "Iterative Refinement",
            "Scalability Thinking",
            "Creative Solution Generation"
        ],
        "competencies": [
            "Breaking complex problems into manageable parts",
            "Recognizing similar patterns from past problems",
            "Identifying and listing all constraints",
            "Starting with a working solution before optimizing",
            "Analyzing trade-offs between different approaches",
            "Systematically identifying edge cases",
            "Testing solutions thoroughly",
            "Iterating to improve solutions",
            "Considering scalability implications",
            "Thinking creatively about alternative approaches"
        ],
        "pitfalls": [
            "Jumping to the optimal solution without a working version first",
            "Not considering all constraints and requirements",
            "Failing to think about edge cases",
            "Ignoring trade-offs between solutions",
            "Not testing with realistic data",
            "Being inflexible when initial approach doesn't work",
            "Overthinking simple problems",
            "Not asking for clarification on ambiguous requirements",
            "Failing to validate assumptions",
            "Not thinking about scalability and performance"
        ]
    },
    
    "Data Structures": {
        "concept": "The organizational methods for storing and managing data efficiently. Understanding data structures is fundamental to writing efficient algorithms and understanding how different operations (search, insert, delete) perform under various conditions.",
        "subtopics": [
            "Arrays and Dynamic Arrays",
            "Linked Lists (Singly, Doubly, Circular)",
            "Stacks and Queues",
            "Hash Tables and Hash Maps",
            "Binary Trees and Binary Search Trees",
            "Balanced Trees (AVL, Red-Black)",
            "Graphs (Directed, Undirected, Weighted)",
            "Heaps (Min-Heap, Max-Heap)",
            "Tries and Suffix Arrays",
            "Union-Find (Disjoint Set Union)"
        ],
        "competencies": [
            "Understanding the time and space complexity of each data structure",
            "Knowing when to use each data structure",
            "Implementing basic data structures from scratch",
            "Understanding insertion, deletion, and search operations",
            "Recognizing problems that benefit from specific data structures",
            "Understanding trade-offs between different structures",
            "Optimizing by choosing the right data structure",
            "Understanding how real languages implement these structures"
        ],
        "pitfalls": [
            "Using arrays when hash tables would be more efficient",
            "Not understanding time complexity of data structure operations",
            "Overcomplicating with unnecessary structures",
            "Using wrong data structure for the problem",
            "Not considering space overhead of structures",
            "Failing to implement edge cases properly",
            "Not understanding when to use balanced vs unbalanced trees",
            "Forgetting about real-world practical considerations"
        ]
    },
    
    "Behavioral": {
        "concept": "The soft skills and interpersonal competencies demonstrated during interviews, including how you collaborate, handle challenges, exhibit leadership, and navigate conflicts. Behavioral questions assess your cultural fit and ability to work effectively in teams.",
        "subtopics": [
            "Teamwork and Collaboration",
            "Leadership and Initiative",
            "Handling Conflict and Disagreement",
            "Learning from Failure",
            "Adaptability and Flexibility",
            "Time Management and Prioritization",
            "Motivation and Drive",
            "Customer Focus and Impact",
            "Technical Leadership",
            "Mentoring and Knowledge Sharing"
        ],
        "competencies": [
            "Collaborating effectively with team members",
            "Taking initiative and ownership",
            "Handling disagreement diplomatically",
            "Learning from mistakes and feedback",
            "Adapting to new situations and technologies",
            "Prioritizing when faced with multiple demands",
            "Demonstrating passion for technology",
            "Thinking about user impact and value",
            "Mentoring junior developers",
            "Communicating across technical and non-technical audiences"
        ],
        "pitfalls": [
            "Blaming others for failures",
            "Not taking ownership of mistakes",
            "Failing to demonstrate growth mindset",
            "Appearing inflexible or unwilling to learn",
            "Not considering team dynamics",
            "Appearing self-centered or dismissive of others' ideas",
            "Failing to communicate impact and results",
            "Not showing passion or enthusiasm",
            "Avoiding responsibility for difficult situations",
            "Not demonstrating willingness to help others"
        ]
    },
    
    "Object-Oriented Design": {
        "concept": "The principles and patterns for designing object-oriented software that is modular, extensible, and maintainable. OOP design assesses your ability to structure code in a way that promotes reusability and follows established design principles.",
        "subtopics": [
            "Encapsulation and Information Hiding",
            "Inheritance vs Composition",
            "Polymorphism and Method Overriding",
            "Abstract Classes and Interfaces",
            "SOLID Principles",
            "Design Patterns (Creational, Structural, Behavioral)",
            "Dependency Injection",
            "Loose Coupling and High Cohesion",
            "Class Hierarchies and Relationships",
            "Extensibility and Open-Closed Principle"
        ],
        "competencies": [
            "Designing class hierarchies that model the problem domain",
            "Deciding when to use inheritance vs composition",
            "Using abstract classes and interfaces appropriately",
            "Applying SOLID principles in practice",
            "Recognizing and applying design patterns",
            "Writing flexible code that handles future requirements",
            "Using polymorphism effectively",
            "Understanding and applying dependency injection",
            "Maintaining clear separation of concerns",
            "Designing for testability and modularity"
        ],
        "pitfalls": [
            "Creating overly deep inheritance hierarchies",
            "Not separating concerns properly (low cohesion)",
            "Creating tight coupling between classes",
            "Not using interfaces and abstractions",
            "Overusing design patterns (premature complexity)",
            "Not considering how the design will evolve",
            "Mixing concerns in a single class",
            "Using inheritance when composition would be better",
            "Not making code testable",
            "Creating fragile designs that break easily with changes"
        ]
    },
    
    "Database Design": {
        "concept": "The process of designing database schemas that efficiently store, retrieve, and manage data while maintaining integrity and supporting application requirements. Database design involves understanding normalization, indexing, query optimization, and trade-offs between different database paradigms.",
        "subtopics": [
            "Database Normalization Forms (1NF-3NF, BCNF)",
            "Schema Design and Relationships",
            "Indexing Strategies",
            "Query Optimization",
            "Transactions and ACID Properties",
            "Denormalization for Performance",
            "Sharding Strategies",
            "Replication and Consistency Models",
            "SQL Query Optimization",
            "NoSQL Database Selection"
        ],
        "competencies": [
            "Designing normalized schemas that avoid redundancy",
            "Choosing appropriate primary and foreign keys",
            "Understanding indexing and its performance impact",
            "Writing efficient SQL queries",
            "Understanding transaction semantics and isolation levels",
            "Choosing between normalization and denormalization",
            "Selecting appropriate database engines",
            "Designing for scalability",
            "Understanding consistency trade-offs",
            "Optimizing for specific access patterns"
        ],
        "pitfalls": [
            "Not normalizing data (causing redundancy and update anomalies)",
            "Over-normalizing (creating too many joins)",
            "Choosing wrong data types",
            "Not using indexes appropriately",
            "Writing inefficient queries without understanding execution plans",
            "Not considering scalability during design",
            "Failing to use transactions properly",
            "Not backing up or considering disaster recovery",
            "Choosing database paradigm without understanding requirements",
            "Not modeling relationships correctly"
        ]
    }
}
