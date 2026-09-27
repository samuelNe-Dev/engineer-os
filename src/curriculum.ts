export type Lesson = [title: string, learn: string, build: string]
export type Week = {
  title: string
  outcome: string
  ship: string
  check: string
  lessons: Lesson[]
}
export const phases = [
  { name: 'Build your foundations', subject: 'C# & .NET', range: '01–04' },
  {
    name: 'Ship a working API',
    subject: 'ASP.NET Core & data',
    range: '05–08',
  },
  {
    name: 'Design for change',
    subject: 'Software architecture',
    range: '09–12',
  },
  { name: 'Make it resilient', subject: 'Distributed systems', range: '13–16' },
  { name: 'Think in systems', subject: 'System design', range: '17–20' },
  {
    name: 'Show what you can do',
    subject: 'Interviews & applications',
    range: '21–24',
  },
]
// One evolving project makes the curriculum concrete: a job-application tracker.
export const weeks: Week[] = [
  {
    title: 'Think in C#',
    outcome: 'Build a small program you can explain line by line.',
    ship: 'Create a console job-application tracker: add, list and filter applications. Keep data in memory. Include run instructions and three example inputs.',
    check:
      'It runs from a fresh terminal, rejects blank company names and filters by status.',
    lessons: [
      [
        'Your first small program',
        'Read about the .NET CLI, variables and console input. Compare C# types with TypeScript.',
        'Create a console project. Read a company and role, then print an application summary. Run it with dotnet run.',
      ],
      [
        'Make invalid input boring',
        'Explore value types, nullable values, parsing and branching.',
        'Add a menu loop. Handle blank input and a non-numeric menu choice without crashing.',
      ],
      [
        'Give data a shape',
        'Compare classes, records and enums; consider mutability.',
        'Model an Application record with company, role and a status enum. Create three instances.',
      ],
      [
        'Work with a collection',
        'Explore List<T>, loops and small methods with one responsibility.',
        'Store applications in a list. Extract add, list and filter functions. Handle an empty list.',
      ],
      [
        'Debug with intention',
        'Learn breakpoints, stepping and inspecting values.',
        'Introduce a wrong status filter, diagnose it with the debugger and fix it. Write down the cause before changing code.',
      ],
    ],
  },
  {
    title: 'Model behavior',
    outcome: 'Choose simple abstractions without overengineering.',
    ship: 'Refactor the tracker into a small domain model with a replaceable in-memory store. Add a README explaining where inheritance would be unnecessary.',
    check:
      'The console UI uses an interface; invalid status changes are rejected in one place.',
    lessons: [
      [
        'Protect an invariant',
        'Read about constructors, properties and encapsulation.',
        'Move status changes into the Application model. Reject an impossible transition, such as Rejected to Interview.',
      ],
      [
        'Use an interface',
        'Explore interfaces and polymorphism.',
        'Define IApplicationStore with add and list methods. Implement an in-memory store.',
      ],
      [
        'Prefer composition',
        'Compare composition with inheritance.',
        'Extract a formatter and inject it into your display function. Avoid creating a base class.',
      ],
      [
        'Handle failure explicitly',
        'Compare exceptions with explicit result values.',
        'Return a result for invalid input; catch unexpected failures at the console boundary. Exercise both paths.',
      ],
      [
        'Review your boundaries',
        'Read dependency inversion in your own code.',
        'Swap in a fake store. Identify one unnecessary abstraction and remove it. Sketch the remaining dependencies.',
      ],
    ],
  },
  {
    title: 'Query & work asynchronously',
    outcome: 'Transform data and await I/O without blocking.',
    ship: 'Persist the tracker as JSON and produce a status summary using LINQ. Make save and load asynchronous.',
    check:
      'A restart preserves applications; missing or malformed files produce a helpful message.',
    lessons: [
      [
        'Filter and project',
        'Explore LINQ Where, Select and deferred execution.',
        'Project active applications into display rows. Compare enumerating a query before and after changing the list.',
      ],
      [
        'Group and summarize',
        'Explore GroupBy, OrderBy and aggregation.',
        'Print counts by status and the three most recent applications. Test the empty collection.',
      ],
      [
        'Await real I/O',
        'Read Task, async/await and why .Result can block.',
        'Serialize applications and use async file APIs to save and load. Keep async all the way to the caller.',
      ],
      [
        'Cancel gracefully',
        'Explore CancellationToken and operation cancellation.',
        'Pass a cancellation token through a simulated slow import; cancel it and preserve existing data.',
      ],
      [
        'Reason about concurrency',
        'Distinguish concurrency from parallelism and shared mutable state.',
        'Demonstrate two conflicting saves in a small experiment. Pick and document a simple single-writer approach.',
      ],
    ],
  },
  {
    title: 'Build a testing habit',
    outcome: 'Use tests to make changes with confidence.',
    ship: 'Add an xUnit test project covering validation, status transitions, filtering and persistence. Refactor one method with tests as a safety net.',
    check:
      'dotnet test passes; a deliberately broken transition causes a meaningful test failure.',
    lessons: [
      [
        'Your first useful test',
        'Read Arrange–Act–Assert and test naming.',
        'Test a valid status transition and a rejected transition using xUnit. Assert behavior, not private methods.',
      ],
      [
        'Test the edges',
        'Explore theory tests and boundary values.',
        'Add cases for blank company names, empty lists and duplicate identifiers.',
      ],
      [
        'Keep tests independent',
        'Learn fakes and deterministic test data.',
        'Use a fake store to test the application service. Ensure tests pass in any order.',
      ],
      [
        'Test a real boundary',
        'Distinguish unit and integration tests.',
        'Round-trip JSON in a temporary directory and clean it up. Add a malformed-file case.',
      ],
      [
        'Refactor with evidence',
        'Explore the red–green–refactor loop.',
        'Change the implementation of filtering without changing its tests. Document which risk the tests do not cover.',
      ],
    ],
  },
  {
    title: 'Build an HTTP API',
    outcome: 'Expose your tracker through clear HTTP contracts.',
    ship: 'Create an ASP.NET Core API for create, list, get and change-status operations. Keep the in-memory store for now.',
    check:
      'curl can create and fetch an application; invalid requests return useful 4xx responses.',
    lessons: [
      [
        'From console to HTTP',
        'Read request/response, methods and ASP.NET Core routing.',
        'Create the API project and a GET /applications endpoint. Call it from the terminal.',
      ],
      [
        'Create a resource',
        'Learn DTOs, POST semantics and 201 Created.',
        'Implement POST /applications with a request DTO and a Location header.',
      ],
      [
        'Get errors right',
        'Read status codes, validation and Problem Details.',
        'Return 400 for invalid input and 404 for missing IDs. Keep exception details out of responses.',
      ],
      [
        'Compose dependencies',
        'Explore dependency injection lifetimes and middleware.',
        'Register the store and service deliberately. Explain why the chosen lifetimes work.',
      ],
      [
        'Test the HTTP boundary',
        'Read WebApplicationFactory integration testing.',
        'Test a create–fetch flow and an invalid request through the HTTP pipeline.',
      ],
    ],
  },
  {
    title: 'Persist with PostgreSQL',
    outcome: 'Store real relational data with EF Core.',
    ship: 'Replace the in-memory store with EF Core and PostgreSQL. Commit migrations and local database setup instructions.',
    check:
      'A database created from migrations supports create and list; API restarts preserve records.',
    lessons: [
      [
        'Start the database',
        'Read relational tables, keys and connection strings.',
        'Run PostgreSQL locally in Docker. Put development credentials in local configuration excluded from git.',
      ],
      [
        'Map the model',
        'Learn DbContext, entity configuration and migrations.',
        'Add EF Core with the PostgreSQL provider. Create and apply the initial migration.',
      ],
      [
        'Write and read',
        'Explore tracking and SaveChangesAsync.',
        'Implement create and query operations using the context. Pass cancellation tokens.',
      ],
      [
        'Shape a relationship',
        'Read foreign keys and one-to-many relationships.',
        'Add application notes in a related table. Create a migration and query notes for one application.',
      ],
      [
        'Test persistence',
        'Compare real database integration tests with in-memory substitutes.',
        'Test one persistence flow against a disposable PostgreSQL database. Prove a foreign key is enforced.',
      ],
    ],
  },
  {
    title: 'Understand your queries',
    outcome: 'Explain correctness and cost in SQL.',
    ship: 'Add paginated application search with status and company filters. Capture one query plan before and after adding a justified index.',
    check:
      'Pagination is deterministic, SQL is parameterized, and the index addresses an observed query.',
    lessons: [
      [
        'Write SQL yourself',
        'Read SELECT, WHERE, ORDER BY and NULL semantics.',
        'Write SQL for status filtering and recent applications. Compare results with the EF query.',
      ],
      [
        'Join without surprises',
        'Compare INNER JOIN and LEFT JOIN.',
        'List applications with note counts, including applications with zero notes. Check for duplicate rows.',
      ],
      [
        'Measure an index',
        'Read EXPLAIN and B-tree index trade-offs.',
        'Seed realistic data. Measure a filtered query, add an index, compare plans and write down the write-cost trade-off.',
      ],
      [
        'Make updates atomic',
        'Explore transactions and isolation.',
        'Update a status and insert an audit entry in one transaction. Force a failure and verify rollback.',
      ],
      [
        'Bound the result set',
        'Read pagination, ordering and the N+1 problem.',
        'Add capped page size and stable ordering. Inspect generated SQL and remove an N+1 query if present.',
      ],
    ],
  },
  {
    title: 'Package a complete service',
    outcome: 'Run the API and database predictably.',
    ship: 'Provide a Docker Compose setup for the API and PostgreSQL, a health endpoint and a smoke-test script.',
    check:
      'A documented command starts the service; a health check and create–read smoke test pass.',
    lessons: [
      [
        'Build a small image',
        'Read Docker layers and multi-stage builds.',
        'Write a multi-stage Dockerfile. Run the API as a non-root user.',
      ],
      [
        'Connect the containers',
        'Learn Compose networks, volumes and service names.',
        'Connect the API to PostgreSQL in Compose. Persist database data in a volume.',
      ],
      [
        'Configure safely',
        'Read environment configuration and secret handling.',
        'Separate dev settings from deploy settings. Add an example configuration with no real secrets.',
      ],
      [
        'Know when it is ready',
        'Compare liveness with readiness.',
        'Add health checks for process health and database connectivity. Test a database outage.',
      ],
      [
        'Prove a fresh start',
        'Read reproducible setup and migration strategies.',
        'Run from a clean checkout, apply migrations explicitly and execute a smoke test. Fix undocumented steps.',
      ],
    ],
  },
  {
    title: 'Draw useful boundaries',
    outcome: 'Explain architecture through actual responsibilities.',
    ship: 'Separate domain rules, application use cases and infrastructure only where the current code benefits. Draw a dependency diagram.',
    check: 'A domain-rule test runs without HTTP or database dependencies.',
    lessons: [
      [
        'Map the current system',
        'Explore cohesion, coupling and dependency direction.',
        'Sketch current components and arrows. Mark one place where a rule depends on infrastructure.',
      ],
      [
        'Extract a use case',
        'Read application services and orchestration.',
        'Move change-status orchestration into a use case. Keep the HTTP handler small.',
      ],
      [
        'Keep domain rules local',
        'Explore domain models versus anemic data holders.',
        'Make the status-transition policy independent of EF Core and HTTP. Test it in isolation.',
      ],
      [
        'Invert one dependency',
        'Read ports and adapters.',
        'Introduce one useful port for an external dependency. Implement a test fake and a real adapter.',
      ],
      [
        'Check the cost',
        'Compare layered and vertical-slice organization.',
        'Document which structure suits this project and why. Remove a pass-through abstraction if it adds no value.',
      ],
    ],
  },
  {
    title: 'Design for a changing requirement',
    outcome: 'Use principles to solve concrete change pressure.',
    ship: 'Add a follow-up reminder rule with replaceable delivery, keeping existing behavior intact.',
    check:
      'The reminder rule is testable; changing delivery requires no change to domain rules.',
    lessons: [
      [
        'Start with the change',
        'Read separation of concerns and single responsibility.',
        'Write acceptance examples for reminding after seven inactive days. Identify the smallest change.',
      ],
      [
        'Make time testable',
        'Explore deterministic clocks and dependency seams.',
        'Use a clock abstraction or TimeProvider. Test the exact seven-day boundary.',
      ],
      [
        'Use a strategy sparingly',
        'Read strategy and dependency inversion.',
        'Implement console and fake notification delivery behind one interface.',
      ],
      [
        'Protect the public contract',
        'Read backward compatibility and DTO evolution.',
        'Add optional reminder fields without breaking older requests. Add a regression test.',
      ],
      [
        'Review maintainability',
        'Explore duplication versus premature abstraction.',
        'Compare two possible designs in a short ADR. Choose based on present requirements.',
      ],
    ],
  },
  {
    title: 'Own the data boundaries',
    outcome: 'Reason about consistency without unnecessary patterns.',
    ship: 'Add an application audit trail and optimistic concurrency handling. Document transaction ownership.',
    check:
      'Competing updates are detected; a failed update leaves no orphaned audit entry.',
    lessons: [
      [
        'Define a consistency rule',
        'Read aggregates and transactional boundaries.',
        'Specify which status and audit changes must succeed together. Write a failing integration test.',
      ],
      [
        'Keep one transaction owner',
        'Explore EF Core unit-of-work behavior.',
        'Implement the use case with one clear transaction boundary. Avoid nested transaction ownership.',
      ],
      [
        'Detect conflicting writes',
        'Read optimistic concurrency tokens.',
        'Simulate two clients editing the same record. Return a clear conflict response.',
      ],
      [
        'Separate read needs',
        'Explore CQRS as a separation of models, not mandatory infrastructure.',
        'Create a summary projection without loading full tracked entities. Measure the generated query.',
      ],
      [
        'Choose deletion behavior',
        'Read retention, cascades and soft-delete trade-offs.',
        'Decide how notes and audits behave when an application is removed. Test and document that choice.',
      ],
    ],
  },
  {
    title: 'Defend your architecture',
    outcome: 'Explain decisions, alternatives and consequences.',
    ship: 'Produce an architecture README, two ADRs and a five-minute walkthrough of the working tracker.',
    check:
      'Another engineer can run the project and understand two decisions and their trade-offs.',
    lessons: [
      [
        'Describe the context',
        'Read C4 context and container diagrams.',
        'Draw the user, API and database. Label the responsibilities and connections.',
      ],
      [
        'Write a useful ADR',
        'Read decision records: context, options, decision, consequences.',
        'Write an ADR for your code organization using evidence from recent changes.',
      ],
      [
        'Find failure modes',
        'Explore architecture review questions.',
        'List three realistic failure modes and a mitigation or explicit acceptance for each.',
      ],
      [
        'Rehearse a review',
        'Read trade-off communication.',
        'Challenge one earlier choice as a reviewer. Update the ADR if the evidence changes your view.',
      ],
      [
        'Clean the evidence',
        'Explore useful project documentation.',
        'Remove stale setup steps, link tests to key guarantees and outline a five-minute walkthrough.',
      ],
    ],
  },
  {
    title: 'Survive unreliable dependencies',
    outcome: 'Handle remote failures without amplifying them.',
    ship: 'Add a simulated company-information HTTP dependency with timeouts, cancellation and a bounded retry policy.',
    check:
      'A slow or unavailable dependency cannot hang the API; non-retryable failures are not retried.',
    lessons: [
      [
        'Make failure visible',
        'Read latency, partial failure and HttpClientFactory.',
        'Add a fake remote service that can delay or fail. Call it through a typed client.',
      ],
      [
        'Set a time budget',
        'Learn timeouts and cancellation propagation.',
        'Bound remote calls and return a useful degraded response when the budget expires.',
      ],
      [
        'Retry only safely',
        'Read backoff, jitter and retry amplification.',
        'Retry a transient read failure with a strict limit. Do not blindly retry mutations.',
      ],
      [
        'Stop repeated failure',
        'Read circuit-breaker states.',
        'Model closed, open and half-open behavior in a small experiment and record the trade-offs.',
      ],
      [
        'Test the unhappy path',
        'Explore fault injection.',
        'Automate slow, 500 and recovery scenarios. Assert bounded duration and useful responses.',
      ],
    ],
  },
  {
    title: 'Move work into the background',
    outcome: 'Handle duplicate delivery and eventual consistency.',
    ship: 'Implement a reminder worker with an outbox table and idempotent processing. Use a local worker first.',
    check:
      'A duplicate message does not create a duplicate reminder; a crash can be recovered.',
    lessons: [
      [
        'Define the event',
        'Read commands, events and delivery guarantees.',
        'Define ApplicationStatusChanged with an event ID and schema version. Document what it means.',
      ],
      [
        'Persist the intent',
        'Read the transactional outbox pattern.',
        'Write an outbox record in the same transaction as the status change.',
      ],
      [
        'Process in a worker',
        'Explore BackgroundService and polling.',
        'Create a worker that reads pending outbox entries and marks successful deliveries.',
      ],
      [
        'Expect duplicates',
        'Read idempotency and at-least-once delivery.',
        'Deliver the same event twice. Prevent duplicate side effects with a durable uniqueness check.',
      ],
      [
        'Recover from poison work',
        'Explore dead letters and bounded attempts.',
        'Add attempt counts and a failed state. Test restart between delivery and acknowledgement.',
      ],
    ],
  },
  {
    title: 'See what production is doing',
    outcome: 'Investigate failures with useful telemetry.',
    ship: 'Add structured logs, request correlation and basic latency/error metrics. Write a one-page troubleshooting runbook.',
    check:
      'A failed request can be followed across API and worker without logging sensitive payloads.',
    lessons: [
      [
        'Log for a question',
        'Read structured logging and log levels.',
        'Add fields for operation and outcome. Remove secrets and unnecessary personal data from logs.',
      ],
      [
        'Follow one request',
        'Explore trace IDs and correlation.',
        'Carry an operation ID from request to outbox processing. Find both entries for one action.',
      ],
      [
        'Measure user impact',
        'Read rates, errors, duration and percentiles.',
        'Capture request counts and duration. Explain why average latency can hide poor experience.',
      ],
      [
        'Set a service objective',
        'Explore SLIs, SLOs and alert fatigue.',
        'Define one availability or latency objective and a meaningful alert condition.',
      ],
      [
        'Practice an incident',
        'Read incident timelines and blameless reviews.',
        'Break database connectivity, follow your runbook and document detection, diagnosis and recovery.',
      ],
    ],
  },
  {
    title: 'Release with confidence',
    outcome: 'Make deployment and recovery repeatable.',
    ship: 'Add a CI workflow for build and tests, dependency/security checks and a documented deployment/rollback rehearsal.',
    check:
      'CI detects a broken test; your runbook covers a bad release and database migration risks.',
    lessons: [
      [
        'Automate the quality gate',
        'Read CI jobs, artifacts and repeatable builds.',
        'Create a workflow that restores, builds and runs unit tests.',
      ],
      [
        'Test with the real database',
        'Learn CI service containers.',
        'Run PostgreSQL integration tests in CI with isolated test data.',
      ],
      [
        'Review the attack surface',
        'Read validation, authorization boundaries and secret hygiene.',
        'Document that a multi-user API needs authentication and per-resource authorization. Test input limits now.',
      ],
      [
        'Plan a safe migration',
        'Read expand–contract schema changes.',
        'Design a backward-compatible column change and a recovery plan that does not assume migrations are reversible.',
      ],
      [
        'Rehearse rollback',
        'Explore release artifacts and health verification.',
        'Run two local image versions. Switch to the new version, fail a smoke test and restore the prior version.',
      ],
    ],
  },
  {
    title: 'Design from requirements',
    outcome: 'Structure an ambiguous design conversation.',
    ship: 'Write a system-design brief for a shared job tracker: requirements, estimates, API, data and an initial architecture.',
    check:
      'Every major component addresses a stated requirement; assumptions and exclusions are explicit.',
    lessons: [
      [
        'Ask better questions',
        'Read functional versus non-functional requirements.',
        'List users, core actions and reliability needs. Choose a scope that fits a 35-minute interview.',
      ],
      [
        'Estimate before scaling',
        'Practice rough traffic and storage calculations.',
        'Estimate active users, requests per second and yearly storage with visible assumptions.',
      ],
      [
        'Define the contract',
        'Explore API and data-model-first design.',
        'Sketch three endpoints and their entities. Include an error case and a pagination choice.',
      ],
      [
        'Draw the simplest system',
        'Read load balancers, application servers and databases.',
        'Draw a first design with component responsibilities. Identify its first likely bottleneck.',
      ],
      [
        'Walk one request',
        'Explore end-to-end reasoning.',
        'Trace a create request, including validation, persistence, response and a failure path.',
      ],
    ],
  },
  {
    title: 'Scale reads deliberately',
    outcome: 'Choose caching and storage with clear trade-offs.',
    ship: 'Design a read-heavy job-search service, including a caching policy and a measured local caching experiment.',
    check:
      'You can explain cache invalidation, stale data tolerance and the next bottleneck.',
    lessons: [
      [
        'Find the expensive read',
        'Read cache-aside and cache hit rates.',
        'Measure one repeated query in your tracker and state whether caching is justified.',
      ],
      [
        'Choose freshness',
        'Explore TTLs and invalidation.',
        'Prototype a bounded in-memory cache. Test stale reads and expiration with a controllable clock.',
      ],
      [
        'Avoid a stampede',
        'Read concurrent misses and request coalescing.',
        'Simulate simultaneous misses. Describe or implement a single-flight protection.',
      ],
      [
        'Pick a storage model',
        'Compare relational, document and key-value access patterns.',
        'Compare storage choices for job search using query patterns, consistency and operations cost.',
      ],
      [
        'Reason about replicas',
        'Read replication lag and read-your-writes.',
        'Draw a read-replica path and explain what a user sees immediately after an update.',
      ],
    ],
  },
  {
    title: 'Design reliable workflows',
    outcome: 'Make asynchronous trade-offs explicit.',
    ship: 'Design a notification system with deduplication, retries, user preferences and observability.',
    check:
      'A sequence diagram includes duplicate, delayed and permanently failed deliveries.',
    lessons: [
      [
        'Separate acceptance from delivery',
        'Read queues and asynchronous user journeys.',
        'Define what a 202 response promises. Draw the path from request to worker.',
      ],
      [
        'Control pressure',
        'Explore backpressure and queue lag.',
        'Estimate worker throughput and backlog drain time. State when to shed or delay work.',
      ],
      [
        'Design deduplication',
        'Read idempotency keys and retention windows.',
        'Specify key storage, uniqueness and expiry for notification requests. Test two identical submissions locally.',
      ],
      [
        'Discuss consistency',
        'Explore eventual consistency and reconciliation.',
        'Describe a lost acknowledgement and a recovery process. Avoid claiming exactly-once delivery.',
      ],
      [
        'Compare partition choices',
        'Read partitioning, ordering and hot keys.',
        'Choose a partition key and explain which ordering is guaranteed and where hot spots remain.',
      ],
    ],
  },
  {
    title: 'Run a system-design interview',
    outcome: 'Present a complete design within a time limit.',
    ship: 'Complete a 35-minute mock design for a URL shortener and a second pass that improves the weakest area.',
    check:
      'You cover scope, estimates, data, architecture, one bottleneck and one failure within the timebox.',
    lessons: [
      [
        'Scope the unfamiliar',
        'Review the requirement-first design structure.',
        'Spend ten minutes defining a URL shortener. List collision, abuse and expiration questions.',
      ],
      [
        'Choose identifiers',
        'Explore uniqueness and collision handling.',
        'Compare random IDs with encoded counters. Implement a small collision-handling experiment.',
      ],
      [
        'Design the read path',
        'Review caching and durable storage.',
        'Draw redirect lookup, cache miss and missing/expired-link behavior.',
      ],
      [
        'Pressure-test the design',
        'Review failure modes and scale estimates.',
        'Handle a viral link, database failure and abusive traffic. State trade-offs without adding every possible component.',
      ],
      [
        'Rehearse the narrative',
        'Review pacing and interviewer checkpoints.',
        'Practice a ten-minute explanation. Pause twice to invite questions and refine unclear assumptions.',
      ],
    ],
  },
  {
    title: 'Rebuild interview fluency',
    outcome: 'Solve small problems while explaining your reasoning.',
    ship: 'Complete three timed C# exercises and keep an error log with reasoning, complexity and edge cases.',
    check:
      'You can solve one problem again without AI and explain time/space complexity.',
    lessons: [
      [
        'Use a dictionary',
        'Review hash tables and expected complexity.',
        'Solve two-sum in C#. Explain duplicates, missing answers and the time/space trade-off.',
      ],
      [
        'Work with a window',
        'Review two pointers and sliding windows.',
        'Find the longest substring without repeats. Walk through an example before coding.',
      ],
      [
        'Use a stack',
        'Review LIFO and invariants.',
        'Validate bracket pairs. Test nesting, mismatches and empty input.',
      ],
      [
        'Traverse a structure',
        'Review BFS, DFS and visited sets.',
        'Traverse a small dependency graph and detect revisits. Explain queue versus recursion costs.',
      ],
      [
        'Practice under time',
        'Review a structured coding interview approach.',
        'Pick the weakest exercise. Solve it in 25 minutes without AI, then test and review mistakes.',
      ],
    ],
  },
  {
    title: 'Explain your engineering judgment',
    outcome: 'Answer backend and architecture questions clearly.',
    ship: 'Create a concise interview evidence sheet with five technical explanations and three stories from your own work.',
    check:
      'Answers use specific evidence, state trade-offs and fit within two minutes.',
    lessons: [
      [
        'Explain async deeply',
        'Review tasks, threads, cancellation and I/O.',
        'Answer “Does async create a thread?” Use a concrete ASP.NET request example and verify your explanation.',
      ],
      [
        'Explain data decisions',
        'Review indexes, transactions and isolation.',
        'Explain your measured index change, including costs. Prepare a follow-up about competing updates.',
      ],
      [
        'Explain design trade-offs',
        'Review coupling, boundaries and simpler alternatives.',
        'Use one ADR to defend a choice, then explain when you would choose differently.',
      ],
      [
        'Tell a delivery story',
        'Read Situation–Task–Action–Result for behavioral answers.',
        'Write a factual story about a difficult change. Separate your actions from team actions and avoid invented metrics.',
      ],
      [
        'Handle uncertainty',
        'Practice clarifying and reasoning aloud.',
        'Answer an unfamiliar system question. State what you know, ask a clarifying question and propose how to verify the rest.',
      ],
    ],
  },
  {
    title: 'Turn practice into evidence',
    outcome: 'Make your work legible to hiring teams.',
    ship: 'Polish the tracker portfolio, tailor a CV for one real role and prepare an application shortlist with personal criteria.',
    check:
      'Your project runs, claims are supported, and each shortlisted role has a documented reason.',
    lessons: [
      [
        'Select strong evidence',
        'Review evidence-based CV bullets.',
        'Draft three bullets from real work and this project. Include outcomes only when you can substantiate them.',
      ],
      [
        'Polish the project story',
        'Review technical README structure.',
        'Add screenshots or terminal examples, architecture decisions, test commands and honest limitations.',
      ],
      [
        'Define the next role',
        'Reflect on backend depth, learning and team fit.',
        'Write must-haves and trade-offs for your next role, including compensation expectations to research.',
      ],
      [
        'Match one position',
        'Read one current job description critically.',
        'Map requirements to evidence and gaps. Tailor your CV summary without overstating expertise.',
      ],
      [
        'Prepare the conversation',
        'Practice questions that reveal team quality.',
        'Write five questions about ownership, delivery, architecture and growth. Rehearse your introduction.',
      ],
    ],
  },
  {
    title: 'Interview, reflect, move forward',
    outcome: 'Demonstrate growth and choose your next deliberate step.',
    ship: 'Run a full mock interview, send one carefully reviewed application if ready, and write your next six-week learning plan.',
    check:
      'You have a scored mock, a specific improvement plan and a portfolio you can explain unaided.',
    lessons: [
      [
        'Revisit your baseline',
        'Compare current ability with week one.',
        'Rebuild the first console exercise from memory. Note what is easier and what still requires help.',
      ],
      [
        'Run a coding mock',
        'Review interview pacing and communication.',
        'Complete a 30-minute problem with another person or a recording. Score reasoning, correctness and testing.',
      ],
      [
        'Run a design mock',
        'Review the requirement-to-trade-off structure.',
        'Design a small service in 35 minutes. Ask a reviewer to challenge assumptions and capture feedback.',
      ],
      [
        'Make an application ready',
        'Review accuracy, relevance and completeness.',
        'Proofread one tailored application and verify every claim. Submit it yourself if the role fits.',
      ],
      [
        'Choose the next bottleneck',
        'Reflect on deliberate practice and feedback.',
        'Identify the weakest skill from evidence. Draft six weeks of focused practice with a measurable outcome.',
      ],
    ],
  },
]
export const communication = [
  [
    'Be heard',
    'Stand or sit upright. Take a relaxed breath. Speak to someone two metres away, using a comfortable, audible voice. Do not strain.',
  ],
  [
    'Finish your words',
    'Slow the opening sentence. Articulate the final consonants of key technical words. Repeat one unclear sentence.',
  ],
  [
    'Lead with the point',
    'Say your conclusion in the first sentence. Then give the reason, one example and the consequence.',
  ],
  [
    'Make room for pauses',
    'Pause for one beat between ideas. Replace a filler word with a short silence.',
  ],
  [
    'Explain to a colleague',
    'Assume a frontend colleague is new to this backend topic. Define one unfamiliar term before using it.',
  ],
  [
    'Use one concrete example',
    'Explain the idea using a specific application from your tracker. Avoid listing definitions.',
  ],
  [
    'Keep the thread',
    'Announce your main point, explain it and return to it at the end. Keep only one supporting example.',
  ],
  [
    'Give a useful update',
    'Say what changed, why it matters and what happens next. Finish within two minutes.',
  ],
  [
    'Make a recommendation',
    'State your recommended design, its strongest reason and one accepted trade-off.',
  ],
  [
    'Compare two options',
    'Name two options. Compare them against one requirement. Recommend one and say when you would revisit it.',
  ],
  [
    'Disagree constructively',
    'Acknowledge the other approach. State your concern with a concrete failure case. Propose a next step.',
  ],
  [
    'Present a decision',
    'Walk through context, your decision and its consequences. Invite one question before the end.',
  ],
  [
    'Explain a failure',
    'Describe what users see, why it happens and how the system recovers. Avoid unnecessary implementation detail.',
  ],
  [
    'Use a helpful analogy',
    'Explain a queue using a familiar example, then say where the analogy stops being accurate.',
  ],
  [
    'Speak during an incident',
    'Give a calm update: known impact, current evidence, next investigation and next update.',
  ],
  [
    'Ask for a decision',
    'State the release decision needed, options, recommendation and the risk being accepted.',
  ],
  [
    'Clarify before solving',
    'Ask two precise questions before proposing a design. Summarize your understanding aloud.',
  ],
  [
    'Explain a trade-off',
    'Describe what you gain, what you lose and why the requirement makes the trade-off acceptable.',
  ],
  [
    'Handle an interruption',
    'Pause for an imagined question. Answer it directly, then return to your previous point.',
  ],
  [
    'Control the timebox',
    'Give a short outline. At halfway, summarize progress and move to the most important remaining point.',
  ],
  [
    'Think aloud clearly',
    'State a hypothesis, walk one example and explain the next check. Avoid narrating every keystroke.',
  ],
  [
    'Tell an evidence-based story',
    'Use a real example. Make your personal contribution clear and state what you learned.',
  ],
  [
    'Introduce yourself',
    'Give a 90-second introduction: what you do, one strength with evidence and what you want to work on next.',
  ],
  [
    'Sound like yourself',
    'Use plain words and a comfortable pace. Finish with a clear point instead of trailing off.',
  ],
]
export const resources = [
  {
    label: 'Microsoft · C# guide',
    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/',
  },
  {
    label: 'Microsoft · ASP.NET Core',
    url: 'https://learn.microsoft.com/en-us/aspnet/core/',
  },
  {
    label: 'Microsoft · Architecture guides',
    url: 'https://learn.microsoft.com/en-us/dotnet/architecture/',
  },
  {
    label: 'Microsoft · Cloud design patterns',
    url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/',
  },
  {
    label: 'Microsoft · Architecture Center',
    url: 'https://learn.microsoft.com/en-us/azure/architecture/',
  },
  {
    label: 'Microsoft · C# collections',
    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/collections',
  },
]
export function session(week: number, day: number) {
  const w = weeks[week]
  if (day === 5)
    return {
      title: 'Build & connect the pieces',
      learn:
        'Review your notes and sketch today’s implementation before opening the editor.',
      build: w.ship,
      check: w.check,
      minutes: 150,
      learnMinutes: 15,
      buildMinutes: 130,
    }
  const lesson = w.lessons[Math.min(day, 4)]
  return {
    title: lesson[0],
    learn: lesson[1],
    build: lesson[2],
    check:
      'Run your solution, demonstrate one edge case and save a short note explaining the result.',
    minutes: 45,
    learnMinutes: 10,
    buildMinutes: 30,
  }
}
export const skillNames = [
  'C# / .NET',
  'ASP.NET Core',
  'EF Core / PostgreSQL / SQL',
  'Testing',
  'Docker',
  'Software architecture',
  'Distributed systems',
  'System design',
  'Technical interviews',
  'Technical communication',
]
export const skillLevels = [
  'Not started',
  'Seen',
  'Practiced',
  'Can explain',
  'Can build',
]
export const speakingPrompts = (week: number, day: number) => [
  `Explain ${weeks[week].lessons[Math.min(day, 4)][0].toLowerCase()} to a frontend colleague.`,
  `What is one design choice you made in “${weeks[week].title}”, and why?`,
  `Give a meeting update about your tracker: progress, one obstacle and your next step.`,
]
// Specific references replace broad phase libraries where a different tool is the focus.
export function resourceFor(week: number) {
  const overrides: Record<number, { label: string; url: string }> = {
    3: {
      label: 'xUnit · Getting started',
      url: 'https://xunit.net/docs/getting-started/v3/getting-started',
    },
    5: {
      label: 'Microsoft · EF Core',
      url: 'https://learn.microsoft.com/en-us/ef/core/',
    },
    6: {
      label: 'PostgreSQL · SQL tutorial',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
    },
    7: {
      label: 'Docker · Getting started',
      url: 'https://docs.docker.com/get-started/',
    },
    10: {
      label: 'Microsoft · EF Core',
      url: 'https://learn.microsoft.com/en-us/ef/core/',
    },
    21: {
      label: 'Microsoft · .NET architecture',
      url: 'https://learn.microsoft.com/en-us/dotnet/architecture/',
    },
    22: {
      label: 'GitHub · Your project README',
      url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes',
    },
  }
  return overrides[week] ?? resources[Math.floor(week / 4)]
}
