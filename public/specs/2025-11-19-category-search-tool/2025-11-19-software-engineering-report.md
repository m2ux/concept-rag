# Category Report: software engineering

**Date:** 2025-11-19
**Total Chunks Found:** 2000

## Concepts in this Category
- safety-critical software development
- coding standards
- testability
- reusability
- extensibility
- readability
- module design
- coupling
- cohesion
- data encapsulation
- abstraction
- object-oriented design
- generic programming
- templates
- language conformance
- character set restrictions
- run-time checking
- library qualification
- preprocessor minimization
- header/implementation separation

## Content by Document

### Cmp Real-Time Concepts For Embedded Systems Ebook-Lib

*File: Cmp Real-Time Concepts For Embedded Systems Ebook-Lib.pdf*

> Chapter 15: Synchronization And
> Communication
>  
> 15.1 Introduction 
> Software applications for real-time embedded systems use concurrency to maximize efficiency. As a result, an
> application's design typically involves multiple concurrent threads, tasks, or processes. Coordinating these activities
> requires inter-task synchronization and communication. 
> This chapter focuses on: 
> •
> resource synchronization, 
> •
> activity synchronization, 
> •
> inter-task communication, and 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, intertask synchronization, concurrency design, resource synchronization, inter-task communication, barrier synchronization, concurrency theory, real-time middleware

---

> Shih, Chia-Shiang, and John A. Stankovic. 1990. Distributed Deadlock Detection in Ada Runtime Environments.
> ACM.
>  
> Simon, David E. 2000. An Embedded Software Primer. Boston, MA: Addison-Wesley.
>  
> Singhal, Mukesh and Niranjan G. Shivaratri. 1994. Advanced Concepts in Operating Systems. McGraw-Hill, Inc.
>  
> Sprunt, B., L. Sha, and J.P. Lehoczky. 'Aperiodic Task Scheduling for Hard Real-Time Systems.' The Journal of
> Real-Time Systems (1989): pages 27-60.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, hard real-time systems, soft real-time systems, deadlock, scheduling theory, real-time middleware, distributed real-time systems, distributed systems

---

> system. Figure 3.6: Software components of a target image. Figure 3.7: The software initialization process. 
> Chapter 4:
>  Introduction To Real-Time Operating
> Systems
>  
> Figure 4.1: High-level view of an RTOS, its kernel, and other components found in embedded systems. Figure 4.2:
> Common components in an RTOS kernel that including objects, the scheduler, and some services. Figure 4.3:
> Multitasking using a context switch. Figure 4.4: Preemptive priority-based scheduling. Figure 4.5: Round-robin and

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, preemptive priority-based scheduling, context switch, multitasking, preemptive priority-based scheduling and round-robin, real-time middleware

---

> 4.5 Objects
>  
> Kernel objects are special constructs that are the building blocks for application development for real-time
> embedded systems. The most common RTOS kernel objects are 
> •
> Tasks are concurrent and independent threads of execution that can compete for CPU execution time. 
> •
> Semaphores are token-like objects that can be incremented or decremented by tasks for synchronization or
> mutual exclusion. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, intertask synchronization, mutual exclusion, resource synchronization, barrier synchronization, real-time middleware

---

> exception that can arise when designing a real-time embedded application. If two guidelines or recommendations
> appear to contain opposing thoughts, they should be treated as constituting a tradeoff that the designer needs to
> consider. 
> At the completion of the application decomposition process, robust systems must validate the schedulability of the
> newly formed tasks. Quantitative schedulability analysis on a real-time system determines whether the system as

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, robustness, schedulability analysis, outside-in decomposition, utilization bounds and schedulability tests, real-time middleware

---

> •
> Rendezvous synchronization is used to perform activity synchronization between two tasks. 
> •
> Tasks communicate with each other to transfer data, to signal event occurrences, to allow one task to control
> other tasks, to synchronize activities, and to implement custom resource synchronization protocols. 
> •
> Interrupt locks should be used only when necessary to synchronize access to shared resources between a
> task and an ISR. 
> •
> Preemption locks can cause priority inversion.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, intertask synchronization, priority inversion, spurious interrupts, resource synchronization, barrier synchronization, rendezvous synchronization

---

> completed or the higher priority tasks voluntarily relinquish the CPU. In real-time embedded systems, the kernel
> strives to make the schedulability of the highest priority task deterministic. To do this, the kernel must preempt the
> currently running task and switch the context to run the higher priority task that has just become eligible, all within a
> known time interval. This system scheduling behavior is the norm when these tasks are independent of each other.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, context switch, schedulability analysis, utilization bounds and schedulability tests, scheduling theory, real-time middleware

---

> Stankovic, John A. and Krithi Ramamritham. 1998. Tutorial Hard Real-Time Systems. Washington, D.C.:
> Computer Society Press of the IEEE, ISBN 0-8186-4819-8
>  
> Tanenbaum, Andrew S. 1992. Modern Operating Systems. Englewood Cliffs, NJ: Prentice-Hall, Inc.
>  
> Tzeng, Nian-Feng, and Angkul Kongmunvattana. 1997. 'Distributed Shared Memory Systems with Improved
> Barrier Synchronization and Data Transfer.' In SIGARCH-ACM Transactions on Computer Architecture. ISBN
> 0-89791-902-5.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, intertask synchronization, resource synchronization, barrier synchronization, real-time middleware, distributed real-time systems, distributed systems

---

> •
> Kernels can deploy different algorithms for task scheduling. The most common two algorithms are
> preemptive priority-based scheduling and round-robin scheduling. 
> •
> RTOSes for real-time embedded systems should be reliable, predictable, high performance, compact, and
> scalable. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, preemptive priority-based scheduling, preemptive priority-based scheduling and round-robin, scheduling theory, real-time middleware

---

> In any case, embedded applications need to schedule future events. Scheduling future activities is accomplished
> through timers using timer services. 
> Timers are an integral part of many real-time embedded systems. A timer is the scheduling of an event according to a
> predefined time value in the future, similar to setting an alarm clock. 
> A complex embedded system is comprised of many different software modules and components, each requiring

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, timer services and soft timers, scheduling theory, real-time middleware

---

> 13.6 Points to Remember 
> Some points to remember include the following: 
> •
> Dynamic memory allocation in embedded systems can be built using a fixed-size blocks approach. 
> •
> Memory fragmentation can be classified into either external memory fragmentation or internal memory
> fragmentation. 
> •
> Memory compaction is generally not performed in real-time embedded systems. 
> •
> Management based on memory pools is commonly found in networking-related code. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, internal fragmentation, external fragmentation, real-time networking, real-time middleware

---

> Total utilization for the sample problem is at 57%, which is below the theoretical bound of 77%. This system of three
> tasks is schedulable, i.e., every task can meet its deadline. 
> 14.4.2 Extended RAM Schedulability Test 
> The basic RMA is limiting. The second assumption associated with basic RMA is impractical because tasks in
> real-time systems have inter-dependencies, and task synchronization methods are part of many real-time designs.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, schedulability analysis, barrier synchronization, utilization bounds and schedulability tests, real-time middleware

---

> Poledna, S. 1996. Fault-Tolerant Real-Time Systems: The Problem of Replica Determinism. Boston, MA:
> Kluwer Academic Publishers.
>  
> Sha, L., M.H. Klein, and J.B. Goodenough. 1991. 'Rate Monotonic Analysis for Real-Time Systems.' Foundations
> of Real-Time Computing, Scheduling, and Resource Management . Andre M. Van Tilborg, Gary M. Koob,
> editors. Boston, MA: Kluwer Academic Publishers, ISBN 0-7923-9166-7. Simon, David E. 2000. An Embedded
> Software Primer. Boston, MA: Addison-Wesley.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, determinism, real-time middleware, fault-tolerant computing

---

> port number 189 
> power conservation 67 
> precise exception 149-150 
> predicate 126-128, 252, 254 
> predictability 62-63 
> preemptible resource 260 
> preemption lock 75, 238-240, 246 
> preemptive scheduling 56, 61, 66, 69, 77, 226, 239, 273, 277 
> priority 59-61, 66-72, 74-76, 87-91, 103, 109, 115, 126-129, 147-165, 174-175, 222, 224-226, 239, 259 
> ceiling blocking 279 
> ceiling protocol 278-280 
> inheritance blocking 279 
> inheritance protocol 84, 276-278 
> inversion 75, 82, 84-85, 87, 211, 259- 280

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol, priority ceiling protocol, determinism and predictability, ceiling priority protocol, scheduling theory

---

> Chapter 4: Introduction To
> Real-Time Operating Systems 
> 4.1 Introduction
>  
> A real-time operating system (RTOS) is key to many embedded systems today and, provides a software platform
> upon which to build applications. Not all embedded systems, however, are designed with an RTOS. Some
> embedded systems with relatively simple hardware or a small amount of software application code might not require

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, hard real-time systems, soft real-time systems, real-time middleware

---

> •
> the ability to scale up or down to meet application needs, 
> •
> faster performance, 
> •
> reduced memory requirements, 
> •
> scheduling policies tailored for real-time embedded systems, 
> •
> support for diskless embedded systems by allowing executables to boot and run from ROM or RAM, and 
> •
> better portability to different hardware platforms.
>  
> Today, GPOSes target general-purpose computing and run predominantly on systems such as personal computers,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, hard real-time systems, scheduling theory, real-time middleware

---

> memory protection features, at the expense of performance and memory overhead. Despite these differences, for the
> sake of simplicity, this book uses task to mean either a task or a process. 
> Note that message queues and semaphores are not schedulable entities. These items are inter-task communication
> objects used for synchronization and communication. Chapter 6 discusses semaphores, and Chapter 7 discusses
> message queues in more detail.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, inter-task communication, barrier synchronization, performance engineering

---

> Concurrent design requires developers to decompose an application into small, schedulable, and sequential
> program units. When done correctly, concurrent design allows system multitasking to meet performance and timing
> requirements for a real-time system. Most RTOS kernels provide task objects and task management services to
> facilitate designing concurrency within an application. 
> This chapter discusses the following topics: 
> •
> task definition, 
> •
> task states and scheduling, 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** multitasking, concurrency design, concurrency theory, real-time middleware, performance engineering

---

> Many real-time operating systems provide wrapper functions to handle exceptions and interrupts in order to shield
> the embedded systems programmer from the low-level details. This application-programming layer allows the
> programmer to focus on high-level exception processing rather than on the necessary, but tedious, prologue and
> epilogue system-level processing for that exception. This isolation, however, can create misunderstanding and

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, interrupts and exceptions, spurious interrupts, real-time middleware

---

> Release(Counting_Semaphore)
>  
> This implementation shown in Listing 13.1 and 13.2 enables the memory allocation and deallocation functions to be
> safe for multitasking. The deployment of the counting semaphore and the mutex lock eliminates the priority inversion
> problem when blocking memory allocation is enabled with these synchronization primitives. Chapter 6 discusses
> semaphores and mutexes. Chapter 16 discusses priority inversions.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** multitasking, intertask synchronization, priority inversion, resource synchronization, barrier synchronization

---

> Note that schedulability analysis looks only at how systems meet temporal requirements, not functional requirements. 
> The commonly practiced analytical method for real-time systems is Rate Monotonic Analysis (RMA). Liu and
> Layland initially developed the mathematical model for RMA in 1973. (This book calls their RMA model the basic
> RMA because it has since been extended by later researchers.) The model is developed over a scheduling

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, rate monotonic analysis (rma), utilization bounds and schedulability tests, scheduling theory, real-time middleware

---

> Task synchronization, however, lies outside the scope of basic RMA. 
> Deploying inter-task synchronization methods implies some tasks in the system will experience blocking, which is the
> suspension of task execution because of resource contention. Therefore, the basic RMA is extended to account for
> task synchronization. Equation 14.2 provides the equation for the extended RMA schedulability test.
>  
> where: 
> Ci = worst case execution time associated with periodic task I

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, schedulability analysis, barrier synchronization, utilization bounds and schedulability tests

---

> Access by multiple tasks must be synchronized to maintain the integrity of a shared resource. This process is called 
> resource synchronization , a term closely associated with critical sections and mutual exclusions. 
> Mutual exclusion is a provision by which only one task at a time can access a shared resource. A critical section is
> the section of code from which the shared resource is accessed.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, mutual exclusion, critical sections, resource synchronization, barrier synchronization

---

> One representative of activity synchronization methods is barrier synchronization . For example, in embedded
> control systems, a complex computation can be divided and distributed among multiple tasks. Some parts of this
> complex computation are I/O bound, other parts are CPU intensive, and still others are mainly floating-point
> operations that rely heavily on specialized floating-point coprocessor hardware. These partial results must be

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, intertask synchronization, resource synchronization, barrier synchronization, distributed systems

---

> 15.4 Resource Synchronization Methods 
> Chapter 6 discusses semaphores and mutexes that can be used as resource synchronization primitives. Two other
> methods, interrupt locking and preemption locking, can also be deployed in accomplishing resource synchronization. 
> 15.4.1 Interrupt Locks 
> Interrupt locking (disabling system interrupts) is the method used to synchronize exclusive access to shared

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, intertask synchronization, spurious interrupts, resource synchronization, barrier synchronization

---

> Interrupt locking is simple to implement and involves only a few instructions. However, frequent use of interrupt locks
> can alter overall system timing, with side effects including missed external events (resulting in data overflow) and
> clock drift (resulting in missed deadlines). Interrupt locks, although the most powerful and the most effective
> synchronization method, can introduce indeterminism into the system when used indiscriminately. Therefore, the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** determinism, intertask synchronization, spurious interrupts, resource synchronization, barrier synchronization

---

> by one each time the task gets the semaphore. The task runs as long as the counting semaphore is non-zero. 
> Figure 15.10: ISR-to-task synchronization using counting semaphores. 
> Simple Rendezvous with Data Passing 
> Two tasks can implement a simple rendezvous and can exchange data at the rendezvous point using two message
> queues, as shown in Figure 15.11. Each message queue can hold a maximum of one message. Both message queues

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization, simple rendezvous using message queues

---

> Multiple ways of accomplishing resource synchronization are available. These methods include accessing shared
> memory with mutexes, interrupt locks, or preemption locks and sharing multiple instances of resources using counting
> semaphores and mutexes. 
> Shared Memory with Mutexes 
> In this design pattern, task #1 and task #2 access shared memory using a mutex for synchronization. Each task must

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, intertask synchronization, spurious interrupts, resource synchronization, barrier synchronization

---

> 15.8 Points to Remember 
> Some points to remember include the following: 
> •
> Synchronization is classified into resource and activity synchronization. 
> •
> Resource synchronization is closely related to critical sections and mutual exclusion. 
> •
> Activity synchronization is also called condition synchronization or sequence control. 
> •
> Barrier synchronization can be used to perform activity synchronization for a group of tasks. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, mutual exclusion, critical sections, resource synchronization, barrier synchronization

---

> •
> Access control protocols exist for dealing with priority inversion: priority inheritance protocol, ceiling priority
> protocol, and priority ceiling protocol. 
> •
> Deadlock never occurs under the priority ceiling protocol. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol, priority ceiling protocol, deadlock, ceiling priority protocol

---

> Knotothanassis, Leonidas I., Robert W. Wisneiwski, and Michael L. Scott. 'Scheduler-Conscious Synchronization.' 
> ACM Transactions on Computer Systems 15, no. 1 (February 1997): 3-40.
>  
> Kopetz, Herman. 1997. Real-Time Systems: Design Principles for Distributed Embedded Applications .
> Norwell, MA: Kluwer Academic Publishers.
>  
> Kopetz, H., and G. Gruensteidi. 'TTP-A Protocol for Fault-Tolerant Real-Time Systems.' IEEE Computer 24, no.
> 1 (1994): 14-23.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware, distributed real-time systems, distributed systems

---

> concurrency 61, 65, 77, 145-146, 163, 213, 217-229, 231 
> concurrent 61, 65-66, 79, 90, 231-232, 260 
> condition synchronization 233 
> condition variable 111, 128-130, 233, 235, 258 
> context 58, 60, 71, 75, 152, 156, 158, 161- 162, 171, 174, 214-215, 217, 239, 273 
> switch 57-59, 69, 73, 153, 156, 163, 274 
> controlled system 11-13 
> controlling system 11-12 
> counting semaphore 81-84, 86, 89-90, 93, 95, 209-211, 241, 244-248, 251, 254 
> critical section 74-75, 85, 123, 232, 239-241, 278, 280

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, intertask synchronization, resource synchronization, barrier synchronization, concurrency theory

---

> Figure 15.1: Multiple tasks accessing shared memory. Figure 15.2: Visualization of barrier synchronization. Figure
> 15.3: Simple rendezvous without data passing. Figure 15.4: Loosely coupled ISR-to-task communication using
> message queues. Figure 15.5: Tightly coupled task-to-task communication using message queues. Figure 15.6:
> Task-to-task synchronization using binary semaphores. Figure 15.7: ISR-to-task synchronization using binary

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization, simple rendezvous using message queues

---

> Ch
> apt
> er
> 9
> -Other RTOS Services
> Ch
> apt
> er
> 10
> -Exceptions and Interrupts
> Ch
> apt
> er
> 11
> -Timer and Timer Services
> Ch
> apt
> er
> 12
> -I/O Subsystem
> Ch
> apt
> er
> 13
> -Memory Management
> Ch
> apt
> er
> 14
> -Modularizing An Application For Concurrency
> Ch
> apt
> er
> 15
> -Synchronization And Communication
> Ch
> apt
> er
> 16
> -Common Design Problems
> Ap
> pe
> ndi
> x
> A
> -References
> Index 
> List of Figures 
> List of Tables 
> List of Listings 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts, concurrency design, concurrency theory

---

> experiences shed new light on application development, common design problems, and solutions in the embedded
> space. Technical managers active in software design reviews of real-time embedded systems will find this a valuable
> reference to the design and implementation phases.
>  
> About the Authors 
> Qing Li is a senior architect at Wind River Systems, Inc., and the lead architect of the company s embedded IPv6

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, real-time middleware

---

> auto-braking systems. Embedded systems have significantly improved the way we live today-and will continue to
> change the way we live tomorrow.
>  
> Programming embedded systems is a special discipline, and demands that embedded sys tems developers have
> working knowledge of a multitude of technology areas. These areas range from low-level hardware devices, compiler
> technology, and debugging tech niques, to the inner workings of real-time operating systems and multithreaded

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, hard real-time systems, real-time middleware

---

> If you are an experienced developer but new to real-time embedded systems develop ment, you will also find the
> approach to design in this book quite useful. If you are a technical manager who is active in software design
> reviews of real-time systems, you can refer to this book to become better informed regarding the design and
> implementation phases. This book can also be used as complementary reference material if you are an engineering or
> computer science student.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, real-time middleware

---

> Code for embedded systems (such as the real-time embedded operating system, the system software, and the
> application software) is commonly stored in ROM and NVRAM memory devices. In Chapter 3, we discuss the
> embedded system booting process and the steps involved in extracting code from these storage devices. Upgrading
> an embedded system can mean building new PROM, deploying special equipment and/or a special method to
> reprogram the EPROM, or reprogramming the flash memory.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, real-time middleware

---

> 1.2.3 Hard and Soft Real-Time Systems
>  
> In the previous section, we said computation must complete before reaching a given deadline. In other words,
> real-time systems have timing constraints and are deadline-driven. Real-time systems can be classified, therefore, as
> either hard real-time systems or soft real-time systems.
>  
> What differentiates hard real-time systems and soft real-time systems are the degree of tolerance of missed deadlines,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, soft real-time systems, real-time constraints and deadlines, real-time middleware

---

> from soft real-time systems.
>  
> •
> Real-time systems have a significant amount of application awareness similar to embedded systems.
>  
> •
> Real-time embedded systems are those embedded system with real-time behaviors.
>  
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, real-time middleware

---

> provides basic services, such as resource synchronization services, I/O services, and scheduling services needed by
> the embedded applications; and the other components, which provide additional services, such as file system services
> and network services.
>  
> Figure 3.6: Software components of a target image. 
> These software components perform full system initialization after the target image gains control from the loading
> program.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, scheduling theory

---

> an RTOS. Many embedded systems, however, with moderate-to-large software applications require some form of
> scheduling, and these systems require an RTOS. 
> This chapter sets the stage for all subsequent chapters in this section. It describes the key concepts upon which most
> real-time operating systems are based. Specifically, this chapter provides 
> •
> a brief history of operating systems, 
> •
> a definition of an RTOS, 
> •
> a description of the scheduler, 
> •
> a discussion of objects, 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, real-time middleware

---

> Microsoft Windows operating system helped drive the personal-computing era. 
> Later in the decade, momentum started building for the next generation of computing: the post-PC,
> embedded-computing era. To meet the needs of embedded computing, commercial RTOSes, such as VxWorks,
> were developed. Although some functional similarities exist between RTOSes and GPOSes, many important
> differences occur as well. These differences help explain why RTOSes are better suited for real-time embedded
> systems.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, soft real-time systems, real-time middleware

---

> executes when. Some common examples of scheduling algorithms include round-robin and preemptive
> scheduling.
>  
> •
> Objects-are special kernel constructs that help developers create applications for real-time embedded
> systems. Common kernel objects include tasks, semaphores, and message queues.
>  
> •
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, scheduling theory, real-time middleware

---

> An important point to note here is that the tasks follow the kernel s scheduling algorithm, while interrupt service
> routines (ISR) are triggered to run because of hardware interrupts and their established priorities. 
> As the number of tasks to schedule increases, so do CPU performance requirements. This fact is due to increased
> switching between the contexts of the different threads of execution. 
> 4.4.3 The Context Switch

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, spurious interrupts, scheduling theory, performance engineering

---

> cannot satisfy real-time system requirements because in real-time systems, tasks perform work of varying degrees of
> importance. Instead, preemptive, priority-based scheduling can be augmented with round-robin scheduling which
> uses time slicing to achieve equal allocation of the CPU for tasks of the same priority as shown in Figure 4.5.
> Figure 4.5: Round-robin and preemptive scheduling.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, preemptive priority-based scheduling and round-robin, scheduling theory, real-time middleware

---

> 4.6 Services
>  
> Along with objects, most kernels provide services that help developers create applications for real-time embedded
> systems. These services comprise sets of API calls that can be used to perform operations on kernel objects or can
> be used in general to facilitate timer management, interrupt handling, device I/O, and memory management. Again,
> other services might be provided; these services are those most commonly found in RTOS kernels.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, spurious interrupts, real-time middleware

---

> 4 Nines (99.99%) ~1 hour Enterprise Server
>  
> 5 Nines (99.999%) ~5 minutes Carrier-Class Server
>  
> 6 Nines (99.9999%) ~31 seconds Carrier Switch Equipment 
> 1 Source: 'Providing Open Architecture High Availability Solutions,' Revision 1.0, Published by HA Forum,
> February 2001.
>  
> 4.7.2 Predictability 
> Because many embedded systems are also real-time systems, meeting time requirements is key to ensuring proper

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, determinism and predictability, real-time middleware

---

> 5.6 Synchronization, Communication, and
> Concurrency
>  
> Tasks synchronize and communicate amongst themselves by using intertask primitives , which are kernel objects
> that facilitate synchronization and communication between two or more threads of execution. Examples of such
> objects include semaphores, message queues, signals, and pipes, as well as other types of objects. Each of these is
> discussed in detail in later chapters of this book.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, concurrency theory

---

> 6.2 Defining Semaphores
>  
> A semaphore (sometimes called a semaphore token) is a kernel object that one or more threads of execution can
> acquire or release for the purposes of synchronization or mutual exclusion. 
> When a semaphore is first created, the kernel assigns to it an associated semaphore control block (SCB), a unique
> ID, a value (binary or a count), and a task-waiting list, as shown in Figure 6.1.
> Figure 6.1: A semaphore, its associated parameters, and supporting data structures.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, mutual exclusion, resource synchronization, barrier synchronization

---

> Chapter 16 discusses priority inversion and both the priority inheritance and ceiling priority protocols in more detail.
> For now, remember that a mutex supports ownership, recursive locking, task deletion safety, and priority inversion
> avoidance protocols; binary and counting semaphores do not. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol, priority ceiling protocol, ceiling priority protocol

---

> made unavailable. After the last task finishes doing what it needs to, the task can execute a semaphore flush operation
> on the common semaphore. This operation frees all tasks waiting in the semaphore s task waiting list. The
> synchronization scenario just described is also called thread rendezvous, when multiple tasks  executions need to
> meet at some point in time to synchronize execution control. 
> 6.3.4 Getting Semaphore Information

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> •
> recursive shared-resource-access synchronization, and 
> •
> multiple shared-resource-access synchronization.
>  
> Note that, for the sake of simplicity, not all uses of semaphores are listed here. Also, later chapters of this book
> contain more advanced discussions on the different ways that mutex semaphores can handle priority inversion. 
> 6.4.1 Wait-and-Signal Synchronization 
> Two tasks can communicate for the purpose of synchronization without exchanging data. For example, a binary

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, priority inversion, resource synchronization, barrier synchronization

---

> Chapter 7: Message Queues
>  
> 7.1 Introduction
>  
> Chapter 6 discusses activity synchronization of two or more threads of execution. Such synchronization helps tasks
> cooperate in order to produce an efficient real-time system. In many cases, however, task activity synchronization
> alone does not yield a sufficiently responsive application. Tasks must also be able to exchange messages. To facilitate

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, real-time middleware

---

> in Figure 8.1 and Figure 8.2. Another common use of pipes is for inter-task synchronization. 
> Inter-task synchronization can be made asynchronous for both tasks by using the select operation. 
> In Figure 8.6, task A and task B open two pipes for inter-task communication. The first pipe is opened for data
> transfer from task A to task B. The second pipe is opened for acknowledgement (another data transfer) from task B

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, inter-task communication, barrier synchronization

---

> As depicted in Figure 8.10, signals can also be used for synchronization between tasks. Signals, however, should be
> used sparingly for the following reasons: 
> •
> Using signals can be expensive due to the complexity of the signal facility when used for inter-task
> synchronization. A signal alters the execution state of its destination task. Because signals occur
> asynchronously, the receiving task becomes nondeterministic, which can be undesirable in a real-time system. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, real-time middleware

---

> The periodic event generation capability of the PIT is important to many real-time kernels. At the heart of many
> real-time kernels is the announcement of the timer interrupt occurrence, or the tick announcement, from the ISR to
> the kernel, as well as to the kernel scheduler, if one exists. Many of these kernel schedulers run through their
> algorithms and conduct task scheduling at each tick. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulers and scheduling algorithms, spurious interrupts, scheduling theory, real-time middleware

---

> Chapter 14: Modularizing An
> Application For Concurrency
>  
> 14.1 Introduction 
> Many activities need to be completed when designing applications for real-time systems. One group of activities
> requires identifying certain elements. Some of the more important elements to identify include: 
> 1. system requirements, 
> 2. inputs and outputs, 
> 3. real-time deadlines, 
> 4. events and event response times, 
> 5. event arrival patterns and frequencies, 
> 6. required objects and other components,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** design patterns for real-time applications, concurrency design, concurrency theory, real-time middleware

---

> 7. tasks that need to be concurrent, 
> 8. system schedulability, and 
> 9. useful or needed synchronization protocols for inter-task communications.
>  
> Depending on the design methodologies and modeling tools that a design team is using, the list of steps to be taken
> can vary, as well as the execution order. Regardless of the methodology, eventually a design team must consider how
> to decompose the application into concurrent tasks (Step 7).

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, inter-task communication, barrier synchronization

---

> designed is schedulable. A real-time system is considered schedulable if every task in the system can meet its
> deadline. 
> This chapter also focuses on the schedulability analysis (Step 8). In particular, the chapter introduces a formal method
> known as Rate Monotonic Analysis (RMA). 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, rate monotonic analysis (rma), utilization bounds and schedulability tests, real-time middleware

---

> a task or a process; it can be any schedulable thread of execution that can compete for the CPU's processing time.
> Although ISRs are not scheduled to run concurrently with other routines, they should also be considered in designing
> for concurrency because they follow a preemptive policy and are units of execution competing for CPU processing
> time. The primary objective of this decomposition process is to optimize parallel execution to maximize a real-time

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** concurrency design, outside-in decomposition, concurrency theory, real-time middleware

---

> While this model simplifies resource synchronization, the resource server is a bottleneck. Synchronization primitives,
> such as semaphores and mutexes, and other methods introduced in a later section of this chapter, allow developers to
> implement complex mutual exclusion algorithms. These algorithms in turn allow dynamic coordination among
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, mutual exclusion, resource synchronization, barrier synchronization

---

> Figure 15.2: Visualization of barrier synchronization. 
> Another representative of activity synchronization mechanisms is rendezvous synchronization , which, as its name
> implies, is an execution point where two tasks meet. The main difference between the barrier and the rendezvous is
> that the barrier allows activity synchronization among two or more tasks, while rendezvous synchronization is
> between two tasks.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> In rendezvous synchronization, a synchronization and communication point called an entry is constructed as a
> function call. One task defines its entry and makes it public. Any task with knowledge of this entry can call it as an
> ordinary function call. The task that defines the entry accepts the call, executes it, and returns the results to the caller.
> The issuer of the entry call establishes a rendezvous with the task that defined the entry.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> Rendezvous synchronization is similar to synchronization using event-registers, which Chapter 8 introduces, in that
> both are synchronous. The issuer of the entry call is blocked if that call is not yet accepted; similarly, the task that
> accepts an entry call is blocked when no other task has issued the entry call. Rendezvous differs from event-register
> in that bidirectional data movement (input parameters and output results) is possible.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> it gets on semaphore #1. When task #2 reaches the rendezvous, it gives semaphore #1, and then it gets on
> semaphore #2. Task #1 has to wait on semaphore #1 before task #2 arrives, and vice versa, thus achieving
> rendezvous synchronization. 
> 15.2.3 Implementing Barriers 
> Barrier synchronization is used for activity synchronization. Listing 15.1 shows how to implement a
> barrier-synchronization mechanism using a mutex and a condition variable. 
> Listing 15.1: Pseudo code for barrier synchronization.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> Some RTOSes block the calling task and then re-enable the system interrupts. The kernel disables interrupts again on
> behalf of the task after the task is ready to be unblocked. The system can hang forever in RTOSes that do not
> support this feature. 
> 15.4.2 Preemption Locks 
> Preemption locking (disabling the kernel scheduler) is another method used in resource synchronization. Many
> RTOS kernels support priority-based, preemptive task scheduling. A task disables the kernel preemption when it

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, preemption locks, spurious interrupts, resource synchronization

---

> 15.6 Common Practical Design Patterns 
> This section presents a set of common inter-tasks synchronization and communication patterns designed from real-life
> scenarios. These design patterns are ready to be used in real-world embedded designs. 
> In these design patterns, the operation of event register manipulation is considered an atomic operation. The
> numberings shown in these design patterns indicate the execution orders. 
> 15.6.1 Synchronous Activity Synchronization

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, inter-task communication, barrier synchronization

---

> Multiple ways of implementing synchronous activity synchronization are available, including: 
> •
> task-to-task synchronization using binary semaphores, 
> •
> ISR-to-task synchronization using binary semaphores, 
> •
> task-to-task synchronization using event registers, 
> •
> ISR-to-task synchronization using event registers, 
> •
> ISR-to-task synchronization using counting semaphores, and 
> •
> simple rendezvous with data passing. 
> Task-to-Task Synchronization Using Binary Semaphores

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> complete the MP-task during the priority inversion. Although some tasks are completed early, other tasks, such as
> the HP-task, might miss their deadlines. This issue is called timing anomaly introduced by priority inversion. 
> Priority inversion results from resource synchronization among tasks of differing priorities. Priority inversion cannot be
> avoided, but it can be minimized using resource access control protocols.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, priority inversion, resource synchronization, barrier synchronization

---

> The priority inheritance protocol is dynamic because a task does not have its priority raised until a higher-priority task
> makes a request on the shared resource. An unrelated higher-priority task can still preempt the task, which is the
> nature of the priority-based, preemptive scheduling scheme. The priority promotion for a task during priority
> inversion is transitive, which means the priority of a promoted task continues to rise even if higher-priority tasks make

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, priority inversion, priority inheritance protocol, scheduling theory

---

> In this example, the MP-task can hold some additional resource required by the HP-task. The HP-task can also
> acquire some other resources needed by the MP-task before the HP-task blocks. When the LP-task releases the
> resource and the HP-task immediately gets to run, it is deadlocked with the MP-task. Therefore, priority inheritance
> protocol does not eliminate deadlock. 
> 16.4.2 Ceiling Priority Protocol

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inheritance protocol, priority ceiling protocol, deadlock, ceiling priority protocol

---

> Appendix A: References 
> Almasi, George S., and Allan Gottlieb. 1994. Highly Parallel Computing. 2nd ed. Redwood City, CA: The
> Benjamin/Cummings Publishing Company, Inc.
>  
> Association of Computing Machinery. 'Source of Unbounded Priority Inversions in Real-Time Systems and a
> Comparative Study of Possible Solutions.' ACM Operating Systems Review 26, no. 2 (April 1992): 110-20.
>  
> Barr, Michael. 1999. Programming Embedded Systems in C and C++. Sebastopol, CA: O'Reilly & Associates,
> Inc.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, priority inversion, real-time middleware

---

> Frailery, Dennis J. 'A Practical Approach to Managing Resources and Avoiding Deadlocks.' Communications of
> ACM 16, no. 5 (May 1973).
>  
> Gomaa, Hassan. 1996. Designing Concurrent, Distributed, and Real-Time Applications with UML. Boston,
> MA: Addison-Wesley.
>  
> Goodenough, John B. and Lui Sha. 'The Priority Ceiling Protocol: A method of minimizing the blocking of high
> priority Ada tasks.'

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, deadlock, ceiling priority protocol, real-time middleware

---

> Ada Letters, Special Issues: Proc. 2 nd Int'l Workshop on Real-Time Ada Issues VIII, Vol. 7, (Fall 1988): 20-31.
>  
> Holt, Richard C. 'Some Deadlock Properties of Computer Systems.' Computing Surveys 4, no. 3 (September
> 1972).
>  
> Howard, John H., Jr. 'Mixed Solutions for the Deadlock Problem.' Communications of ACM 16, no. 7 (July 1973)
>  
> Institute of Electrical and Electronics Engineers. 'Priority Inheritance Protocols: An approach to real-time

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, priority inheritance protocol, deadlock, real-time middleware

---

> Lander, Leslie C., Sandeep Mitra, and Thomas F. Piatkowski. 'Priority Inversion in Ada Programs During
> Elaboration.' Washington Ada Symposium Proceedings (June 1990): 133.
>  
> Lehoczky, J.P., L. Sha, J.K. Strosnider, and H. Tokuda. 1991. 'Fixed Priority Scheduling Theory for Hard
> Real-Time Systems.' Foundations of Real-Time Computing, Scheduling, and Resource Management. Andre M.
> Van Tilborg, Gary M. Koob, editors. Boston, MA: Kluwer Academic Publishers, ISBN 0-7923-9166-7.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, priority inversion, scheduling theory, real-time middleware

---

> Index
>  
> E 
> E2PROMSee EEPROM 
> edge triggering 164 
> EEPROM 8-9, 36, 43 
> Electrically Erasable Programmable ROM
> See EEPROM 
> ELF 24, 36, 38, 43, 45 
> embedded processor 5-7, 39, 51, 143, 145- 146, 149, 154, 169, 202 
> embedding system 5 
> entry 22, 27, 67, 152, 175-177, 183, 196- 197, 203, 207, 265, 269 
> in rendezvous synchronization 234 
> EPROM 8-9 
> Erasable Programmable ROM
> See EPROM 8 
> Ethernet 7, 134, 138, 209 
> event register 118-121, 241, 243, 250-251, 254 
> exception 143-165 
> facility 143, 146

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> soft 14 
> recursive access 82-83 
> recursive mutex 83 
> refresh rate 170 
> release 72, 74, 79-87, 89-91, 93, 124, 127, 129, 174, 211, 245-246, 257, 270, 273- 274 
> reliability 62 
> relocatable object file 21-22 
> relocation
> entry 22, 26 
> table 22-23 
> remote procedure call
> See RPC 
> rendezvous 86, 234 
> reset vector 39, 43, 48 
> resource
> graph 261, 263-264, 266, 270 
> leak 73-74 
> request model 262-264 
> server 233 
> synchronization 231-240, 275 
> resource access control protocol 275

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> Chapter 6:
>  Semaphores
>  
> Figure 6.1: A semaphore, its associated parameters, and supporting data structures. Figure 6.2: The state diagram of
> a binary semaphore. Figure 6.3: The state diagram of a counting semaphore. Figure 6.4: The state diagram of a
> mutual exclusion (mutex) semaphore. Figure 6.5: Wait-and-signal synchronization between two tasks. Figure 6.6:
> Wait-and-signal synchronization between multiple tasks. Figure 6.7: Credit-tracking synchronization between two

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, mutual exclusion, resource synchronization, barrier synchronization

---

> Figure 10.6: Interrupt nesting. Figure 10.7: Nested interrupts and stack overflow. Figure 10.8: Switching SP to
> exception frame. Figure 10.9: Exception timing. Figure 10.10: Interrupt processing in two contexts. Figure 10.11:
> Edge triggering on either rising or falling edge. Figure 10.12: Level triggering. Figure 10.13: Real signals. 
> Chapter 11:
>  Timer and Timer Services
>  
> Figure 11.1: A real-time clock. Figure 11.2: System clock initialization. Figure 11.3: Steps in servicing the timer

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, nested interrupts and interrupt nesting, spurious interrupts, real-time middleware

---

> semaphores. Figure 15.8: Task-to-task synchronization using event registers. Figure 15.9: ISR-to-task
> synchronization using event registers. Figure 15.10: ISR-to-task synchronization using counting semaphores. Figure
> 15.11: Task-to-task rendezvous using two message queues. Figure 15.12: Using signals for urgent data
> communication. Figure 15.13: Task-to-task resource synchronization-shared memory guarded by mutex. Figure

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> are initially empty. When task #1 reaches the rendezvous, it puts data into message queue #2 and waits for a
> message to arrive on message queue #1. When task #2 reaches the rendezvous, it puts data into message queue #1
> and waits for data to arrive on message queue #2. Task #1 has to wait on message queue #1 before task #2 arrives,
> and vice versa, thus achieving rendezvous synchronization with data passing. 
> Figure 15.11: Task-to-task rendezvous using two message queues.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization, rendezvous synchronization

---

> apt
> er
> 2
> -Basics Of Developing For Embedded Systems
> Ch
> apt
> er
> 3
> -Embedded System Initialization
> Ch
> apt
> er
> 4
> -Introduction To Real-Time Operating Systems
> Ch
> apt
> er
> 5
> -Tasks
> Ch
> apt
> er
> 6
> -Semaphores
> Ch
> apt
> er
> 7
> -Message Queues
> Ch
> apt
> er
> 8
> -Other Kernel Objects
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> Back Cover
>  
> Master the fundamental concepts of real-time embedded system programming and jumpstart your embedded
> projects with effective design and implementation practices. This book bridges the gap between higher abstract
> modeling concepts and the lower-level programming aspects of embedded systems development. You gain a solid
> understanding of real-time embedded systems with detailed practical examples and industry wisdom on key

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> Real-Time Concepts for
> Embedded Systems
>  
> Qing Li 
> with Caroline Yao 
> Published by CMP Books
> an imprint of CMP Media LLC
> Main office: 600 Harrison Street, San Francisco, CA 94107 USA
> Tel: 415-947-6615; fax: 415-947-6015
> Editorial office: 1601 West 23rd Street, Suite 200, Lawrence, KS 66046 USA
> www.cmpbooks.com 
> email: books@cmp.com 
> Designations used by companies to distinguish their products are often claimed as trademarks. In all instances where

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> Real-time concepts for embedded systems / Qing Li ; with Caroline Yao.
> p. cm.
> Includes bibliographical references and index.
> ISBN 1-57820-124-1 (alk. paper)
> 1. Embedded computer systems. 2. Real-time programming. I. Yao, Caroline. II. Title.
> Tk7895.E42L494 2003
> 004'.33-dc21
> 2003008483
>  
> Printed in the United States of America
> 03 04 05 06 07 5 4 3 2 1
>  
> To my wife, Huaying, and my daughter, Jane, for their love, understanding, and support.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> implementation of commercial embedded systems, lessons learnt from previous mistakes, wisdom passed down from
> others, and results obtained from academic research. These elements join together to form useful insights, guidelines,
> and recommendations that you can actually use in your real-time embedded systems projects. 
> This book provides a solid understanding of real-time embedded systems with detailed practical examples and

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> Figure 1.2: Embedded systems at work. 
> From various individual network end-points (for example, printers, cable modems, and enterprise network routers)
> to the backbone gigabit switches, embedded technology has helped make use of the Internet necessary to any
> business model. The network routers and the backbone gigabit switches are examples of real-time embedded
> systems. Advancements in real-time embedded technology are making Internet connectivity both reliable and

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> 1.2 Real-Time Embedded Systems
>  
> In the simplest form, real-time systems can be defined as those systems that respond to external events in a timely
> fashion, as shown in Figure 1.5. The response time is guaranteed. We revisit this definition after presenting some
> examples of real-time systems.
>  
> Figure 1.5: A simple view of real-time systems. 
> External events can have synchronous or asynchronous characteristics. Responding to external events includes

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> shortly after we introduce the classifications of real-time systems. 
> Similar to embedded systems, real-time systems also have substantial knowledge of the environment of the controlled
> system and the applications running on it. This reason is one why many real-time systems are said to be deterministic,
> because in those real-time systems, the response time to a detected event is bounded. The action (or actions) taken

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> usefulness of computed results after missed deadlines, and severity of the penalty incurred for failing to meet
> deadlines. 
> For hard real-time systems, the level of tolerance for a missed deadline is extremely small or zero tolerance. The
> computed results after the missed deadline are likely useless for many of these systems. The penalty incurred for a
> missed deadline is catastrophe. For soft real-time systems, however, the level of tolerance is non-zero. The

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, soft real-time systems, real-time middleware

---

> response times with different degrees of acceptability. In a soft real-time system, a missed deadline does not result in
> system failure, but costs can rise in proportion to the delay, depending on the application. 
> Penalty is an important aspect of hard real-time systems for several reasons.
>  
> •
> What is meant by 'must meet the deadline'?
>  
> •
> It means something catastrophic occurs if the deadline is not met. It is the penalty that sets the requirement.
>  
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, soft real-time systems, real-time middleware

---

> •
> It is the penalty. For a hard real-time system, the deadline is a deterministic value, and, for a soft real-time
> system, the value can be estimation.
>  
> One thing worth noting is that the length of the deadline does not make a real-time system hard or soft, but it is the
> requirement for meeting it within that time.
>  
> The weapons defense and the missile guidance systems are hard real-time systems. Using the missile guidance system

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, soft real-time systems, real-time middleware

---

> define their own scheduling algorithms. Each algorithm is described next. 
> Preemptive Priority-Based Scheduling
>  
> Of the two scheduling algorithms introduced here, most real-time kernels use preemptive priority-based scheduling
> by default. As shown in Figure 4.4 with this type of scheduling, the task that gets to run at any point is the task with
> the highest priority among all other tasks ready to run in the system. 
> Figure 4.4: Preemptive priority-based scheduling.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, scheduling theory, real-time middleware

---

> •
> Message Queues are buffer-like data structures that can be used for synchronization, mutual exclusion, and
> data exchange by passing messages between tasks. Developers creating real-time embedded applications
> can combine these basic kernel objects (as well as others not mentioned here) to solve common real-time
> design problems, such as concurrency, activity synchronization, and data communication. These design

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** mutual exclusion, concurrency design, real-time middleware

---

> •
> A real-time application is composed of multiple concurrent tasks that are independent threads of execution,
> competing on their own for processor execution time. 
> •
> Tasks can be in one of three primary states during their lifetime: ready, running, and blocked. 
> •
> Priority-based, preemptive scheduling kernels that allow multiple tasks to be assigned to the same priority use
> task-ready lists to help scheduled tasks run. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, scheduling theory, real-time middleware

---

> 6.4 Typical Semaphore Use 
> Semaphores are useful either for synchronizing execution of multiple tasks or for coordinating access to a shared
> resource. The following examples and general discussions illustrate using different types of semaphores to address
> common synchronization design requirements effectively, as listed: 
> •
> wait-and-signal synchronization, 
> •
> multiple-task wait-and-signal synchronization, 
> •
> credit-tracking synchronization, 
> •
> single shared-resource-access synchronization, 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> gives the lower priority tSignalTask a chance to run; at some point, tSignalTask releases the binary semaphore and
> unblocks tWaitTask. The pseudo code for this scenario is shown in Listing 6.1. 
> Listing 6.1: Pseudo code for wait-and-signal synchronization 
> tWaitTask ( )
> {
>                 :
>                 Acquire binary semaphore token
>                 :
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> checked to see if either a return-from-flush or an error condition has occurred. 
> 6.4.3 Credit-Tracking Synchronization 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> :
>        Acquire mutex
>        Access shared resource
>        Call Routine A
>        Release mutex
>        :
> }
> Routine A ()
> {
>        :
>        Acquire mutex
>        Access shared resource
>        Call Routine B
>        Release mutex
>        :
> }
> Routine B ()
> {
>        :
>        Acquire mutex
>        Access shared resource
>        Release mutex 
>        :
> }
>  
> 6.4.6 Multiple Shared-Resource-Access Synchronization

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> The micro-kernel provides core services, including task-related services, the scheduler service, and synchronization
> primitives. This chapter discusses other common building blocks, as shown in Figure 9.1.
> Figure 9.1: Overview. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> to mean synchronous exceptions and interrupts to mean asynchronous exceptions. The book uses general
> exceptions to mean both. The term interrupts and external interrupts are used interchangeably throughout the text. 
> Exceptions and interrupts are the necessary evils that exist in the majority of embedded systems. This facility, specific
> to the processor architecture, if misused, can become the source of troubled designs. While exceptions and interrupts

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, interrupts and exceptions, spurious interrupts

---

> Chapter 11: Timer and Timer
> Services
>  
> 11.1 Introduction
>  
> In embedded systems, system tasks and user tasks often schedule and perform activities after some time has elapsed.
> For example, a RTOS scheduler must perform a context switch of a preset time interval periodically-among tasks of
> equal priorities-to ensure execution fairness when conducting a round-robin scheduling algorithm. A software-based

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, context switch, scheduling theory

---

> 11.2 Real-Time Clocks and System Clocks 
> In some references, the term real-time clock is interchangeable with the term system clock . Within the context of
> this book, however, these terminologies are separate, as they are different on various architectures. 
> Real-time clocks exist in many embedded systems and track time, date, month, and year. Commonly, they are
> integrated with battery-powered DRAM as shown in Figure 11.1. This integrated real-time clock becomes

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> system are minimal fragmentation, minimal management overhead, and deterministic allocation time. 
> This chapter focuses on: 
> •
> memory fragmentation and memory compaction, 
> •
> an example implementation of the malloc and free functions, 
> •
> fixed-size, pool-based memory management, 
> •
> blocking vs. non-blocking memory functions, and 
> •
> the hardware memory management unit (MMU). 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation, deterministic allocation time

---

> Systems' on page 200 and also has some drawbacks. In real-time embedded systems, a task's memory requirement
> often depends on its operating environment. This environment can be quite dynamic. This method does not work well
> for embedded applications that constantly operate in dynamic environments because it is nearly impossible to
> anticipate the memory block sizes that the task might commonly use. This issue results in increased internal memory

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> This chapter provides guidelines and discussions on how real-time embedded applications can be decomposed.
> Many design teams use formalized object-oriented development techniques and modeling languages, such as UML,
> to model their real-time systems initially. The concepts discussed in this section are complementary to object-oriented
> design approaches; much emphasis is placed on decomposing the application into separate tasks to achieve

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> concurrency. Through examples, approaches to decomposing applications into concurrent tasks are discussed. In
> addition, general guidelines for designing concurrency in a real-time application are provided. 
> These guidelines and recommendations are based on a combination of things-lessons learned from current
> engineering design practices, work done by H. Gomaa, current UML modeling approaches, and work done by other

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** concurrency design, concurrency theory, real-time middleware

---

> execution of multiple tasks; therefore, the term pseudo concurrent execution is used. 
> In contrast, true concurrent execution can be achieved when multiple CPUs are used in the designs of real-time
> embedded systems. For example, if two CPUs are used in a system, two concurrent tasks can execute in parallel at
> one time, as shown in Figure 14.3. This parallelism is possible because two program counters (one for each CPU)

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> 14.4 Schedulability Analysis-Rate Monotonic
> Analysis 
> After an embedded application has been decomposed into ISRs and tasks, the tasks must be scheduled to run in
> order to perform required system functionality. Schedulability analysis determines if all tasks can be scheduled to run
> and meet their deadlines based on the deployed scheduling algorithm while still achieving optimal processor utilization.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, utilization bounds and schedulability tests, scheduling theory

---

> •
> Functional cohesion, temporal cohesion, or sequential cohesion can be used either to form a task or to
> combine tasks. 
> •
> Rate Monotonic Scheduling can be summarized by stating that a task's priority depends on its period-the
> shorter the period, the higher the priority. RMS, when implemented appropriately, produces stable and
> predictable performance. 
> •
> Schedulability analysis only looks at how systems meet temporal requirements, not functional requirements. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, utilization bounds and schedulability tests, scheduling theory

---

> aperiodic tasks are limited to initialization and failure recovery work and that these aperiodic tasks do not
> have hard deadlines. 
> •
> Basic RMA does not account for task synchronization and aperiodic tasks. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> competing tasks without intervention from a third party. 
> 15.2.2 Activity Synchronization 
> In general, a task must synchronize its activity with other tasks to execute a multithreaded program properly. Activity
> synchronization is also called condition synchronization or sequence control . Activity synchronization ensures
> that the correct execution order among cooperating tasks is used. Activity synchronization can be either synchronous
> or asynchronous.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> typedef struct {
>      mutex_t    br_lock;        /* guarding mutex */
>      cond_t     br_cond;        /* condition variable */
>      int        br_count;       /* num of tasks at the barrier */
>      int        br_n_threads;   /* num of tasks participating in the barrier
> synchronization */
> } barrier_t;
> barrier(barrier_t *br)
> {
>      mutex_lock(&br->br_lock);
>      br->br_count++;
>      if (br->br_count < br->br_n_threads)
>          cond_wait(&br->br_cond, &br->br_lock);

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> The value of the binary semaphore is reset to 0 after the synchronization. In this design pattern, task #2 has execution
> dependency on task #1. 
> Figure 15.6: Task-to-task synchronization using binary semaphores. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> One task can synchronize with another task in urgent mode using the signal facility. The signaled task processes the
> event notification asynchronously. In Figure 15.12, a task generates a signal to another task. The receiving task
> diverts from its normal execution path and executes its asynchronous signal routine. 
> Figure 15.12: Using signals for urgent data communication. 
> 15.6.3 Resource Synchronization

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> 16.4 Priority Inversion 
> Priority inversion is a situation in which a low-priority task executes while a higher priority task waits on it due to
> resource contentions. 
> A high task priority implies a more stringent deadline. In a priority-based, preemptive scheduling system, the kernel
> schedules higher priority tasks first and postpones lower priority tasks until either all of the higher priority tasks are

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, priority inversion, scheduling theory

---

> A resource access control protocol is a set of rules that defines the conditions under which a resource can be
> granted to a requesting task and governs the execution scheduling property of the task holding the resource. 
> Access control protocols are discussed in the following sections. These access control protocols eliminate the
> unbound priority inversion, and two of these protocols reduce the inversion time. 
> 16.4.1 Priority Inheritance Protocol

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol, scheduling theory

---

> control of the shared resource, the priority is immediately lowered to its previous level, which allows the HP-task to
> preempt its execution. This action ends the priority inversion at time t4. The HP-task continues its execution,
> however, even when it releases the resource at t5. This is the nature of the priority-based, preemptive scheduling
> scheme. The HP-task runs because it has the highest priority in the system.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, priority inversion, scheduling theory

---

> This access control protocol is shown in Figure 16.10. 
> Figure 16.10: Ceiling priority protocol example. 
> With the ceiling priority protocol, the task inherits the priority ceiling of the resource as soon as the task acquires the
> resource even when no other higher priority tasks contend for the same resource. This rule implies that all critical
> sections from every sharing task have the same criticality level. The idea is to finish the critical section as soon as

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** critical sections, priority ceiling protocol, ceiling priority protocol

---

> Index
>  
> A 
> A/V decoder 5 
> acknowledgement 38, 106-107, 109, 117 
> acquire 73-75, 79-95, 126-127, 129, 205, 210, 236, 245-246, 248, 257, 259-262, 273, 277-278 
> active I/O device 218-222 
> activity synchronization 61, 97, 120, 231-258 
> alignment exception 144 
> allocation table 200-201, 203, 207, 266 
> aperiodic 11-12, 16, 219-223, 226, 229 
> archive utility 20 
> Arshad, Nauman xii
> assembler 20, 23, 26, 30

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Index
>  
> C 
> C&D system 12 
> caches 41, 49 
> catch 124-125 
> ceiling priority protocol 278 
> character-mode device 190, 192 
> checkpoint 209, 269-270, 273 
> checksum 44 
> clock drift 239 
> COFF 24 
> command interpreter 136 
> command shell 134, 136-137, 139 
> Common Object File Format
> See COFF 
> communication 234, 236-238, 247-258 
> compactness 62, 64 
> competing critical section 232, 240 
> component configuration 139, 141 
> table 140 
> component description file 139 
> compression 44 
> computationally bound 218, 225

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, character-mode devices, ceiling priority protocol

---

> resource request model 262 
> resource synchronization 47, 231-258 
> restart 74-75, 209, 269, 273 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> RMA 214, 226-228 
> schedulability test 226 
> RMS 226 
> ROM 9, 42 
> round-robin scheduling 56, 59-61, 175 
> RPC 135-136 
> RTOS 53-64 
> run address 24, 41 
> running state 67-73, 80 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, utilization bounds and schedulability tests, scheduling theory

---

> Index
>  
> S 
> scalability 62 
> schedulability 226-229 
> schedulable entity 57 
> scheduler 46, 56-61, 69, 133, 160, 171, 175, 182, 217, 239-240, 260, 274 
> scheduling
> algorithm 56, 59-61, 69, 226 
> delay 163, 174-175 
> policy 55, 59 
> schematic 28, 170 
> SDRAM 32, 34 
> SECTION 28-30, 33 
> section 24-28 
> header table 24-25, 43 
> select 112, 114, 116-117 
> semaphore 57, 61, 79-95, 138, 234 
> control block 79 
> counting 81, 209-210, 246 
> mutex 82-87, 91-94, 126-129, 209-211, 233, 235-236, 245-246, 254

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, utilization bounds and schedulability tests, scheduling theory

---

> List of Figures
>  
> Chapter 1:
>  Introduction
>  
> Figure 1.1: Embedded systems at home. Figure 1.2: Embedded systems at work. Figure 1.3: Navigation system and
> portable music player. Figure 1.4: A web tablet. Figure 1.5: A simple view of real-time systems. Figure 1.6:
> Real-time embedded systems. Figure 1.7: Structure of real-time systems. 
> Chapter 2:
>  Basics Of Developing For Embedded
> Systems

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> decompose an application into tasks. Figure 14.3: Pseudo and true concurrent (parallel) execution. Figure 14.4:
> Some general properties of active and passive devices. Figure 14.5: General communication mechanisms for active
> I/O devices. Figure 14.6: General communication mechanisms for passive I/O devices. Figure 14.7: Example setup
> for extended RMA. 
> Chapter 15:
>  Synchronization And Communication

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Figure 16.1: Deadlock situation between two tasks. Figure 16.2: Deadlock situation among three tasks. Figure 16.3:
> Current state of resource allocations and requests. Figure 16.4: Resource preemption with a new deadlock. Figure
> 16.5: Deadlock eliminated by proper resource reassignment. Figure 16.6: Priority inversion example. Figure 16.7:
> Unbounded priority inversion example. Figure 16.8: Priority inheritance protocol example. Figure 16.9: Transitive

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol, deadlock

---

> List of Tables
>  
> Chapter 2:
>  Basics Of Developing For Embedded
> Systems
>  
> Table 2.1: Section types. Table 2.2: Section attributes. Table 2.3: Example embedded application with sections. 
> Chapter 4:
>  Introduction To Real-Time Operating
> Systems
>  
> Table 4.1: Categorizing highly available systems by allowable downtime.1 
> Chapter 5:
>  Tasks
>  
> Table 5.1: Operations for task creation and deletion. Table 5.2: Operations for task scheduling. Table 5.3:
> Task-information operations. 
> Chapter 6:
>  Semaphores

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> Common Design Problems
>  
> Table 16.1: Priority Inheritance Protocol rules. Table 16.2: Ceiling priority protocol rules. Table 16.3: Priority ceiling
> protocol rules. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inheritance protocol, priority ceiling protocol, ceiling priority protocol

---

> Listing 6.1: Pseudo code for wait-and-signal synchronization Listing 6.2: Pseudo code for wait-and-signal
> synchronization. Listing 6.3: Pseudo code for credit-tracking synchronization. Listing 6.4: Pseudo code for tasks
> accessing a shared resource. Listing 6.5: Pseudo code for recursively accessing a shared resource. Listing 6.6:
> Pseudo code for multiple tasks accessing equivalent shared resources. Listing 6.7: Pseudo code for multiple tasks

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Real-Time Concepts for Embedded Systems
> by Qing Li and Carolyn
> Yao  
> ISBN:1578201241
> CMP Books © 2003 (294 pages)
> This book bridges the gap between higher abstract
> modeling concepts and the lower-level programming
> aspects of embedded systems development. You gain a
> solid understanding of real-time embedded systems with
> detailed examples and industry wisdom.
>  
> Table of Contents 
> Real-Time Concepts for Embedded Systems 
> Foreword 
> Preface 
> Ch
> apt
> er
> 1
> -Introduction
> Ch
> apt
> er
> 2

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> industry knowledge on key concepts, design issues, and solu tions. This book supplies a rich set of ready-to-use
> embedded design building blocks that can accelerate your development efforts and increase your productivity.
>  
> I hope that Real-Time Concepts for Embedded Systems will become a key reference for you as you embark upon
> your development endeavors.
>  
> If you would like to sign up for e-mail news updates, please send a blank e-mail to:

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> 4.4 The Scheduler 
> The scheduler is at the heart of every kernel. A scheduler provides the algorithms needed to determine which task
> executes when. To understand how scheduling works, this section describes the following topics: 
> •
> schedulable entities, 
> •
> multitasking, 
> •
> context switching, 
> •
> dispatcher, and 
> •
> scheduling algorithms. 
> 4.4.1 Schedulable Entities 
> A schedulable entity is a kernel object that can compete for execution time on a system, based on a predefined

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, dispatcher, multitasking, scheduling theory

---

> nor are all real-time systems embedded. However, the two systems are not mutually exclusive, and the area in which
> they overlap creates the combination of systems known as real-time embedded systems.
> Figure 1.6: Real-time embedded systems. 
> Knowing this fact and because we have covered the various aspects of embedded systems in the previous sections,
> we can now focus our attention on real-time systems. 
> Figure 1.7: Structure of real-time systems. 
> 1.2.1 Real-Time Systems

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> Timing correctness is critical to most hard real-time systems. Therefore, hard real-time systems make every effort
> possible in predicting if a pending deadline might be missed. Returning to the weapons defense system, let us discuss
> how a hard real-time system takes corrective actions when it anticipates a deadline might be missed. In the weapons
> defense system example, the C&D system calculates a firing box around the projected missile flight path. The missile

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing correctness, hard real-time systems, real-time middleware

---

> In this example, it is insufficient to notify the tasks that the final computation has completed; additional information,
> such as the actual computation results, must also be conveyed. 
> The fifth purpose of communication is to implement additional synchronization protocols for resource sharing. The
> tasks of a multithreaded program can implement custom, more-complex resource synchronization protocols on top of
> the system-supplied synchronization primitives.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> The devices that embed them are convenient, user-friendly, and dependable.
>  
> One special class of embedded systems is distinguished from the rest by its requirement to respond to external events
> in real time. This category is classified as the real-time embedded system.
>  
> As an introduction to embedded systems and real-time embedded systems, this chapter focuses on:
>  
> •
> examples of embedded systems,
>  
> •
> defining embedded systems,
>  
> •
> defining embedded systems with real-time behavior, and
>  
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> can have built-in integrated devices, is limited in functionality, produces low heat, consumes low power, and
> does not necessarily have the fastest clock speed but meets the requirements of the specific applications for
> which it is designed.
>  
> •
> Real-time systems are characterized by the fact that timing correctness is just as important as functional or
> logical correctness.
>  
> •
> The severity of the penalty incurred for not satisfying timing constraints differentiates hard real-time systems

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing correctness, hard real-time systems, real-time middleware

---

> perform well in real-time embedded systems. In addition, RTOSes can be easily tailored to use only those
> components required for a particular application. 
> Again, remember that today many smaller embedded devices are still built without an RTOS. These simple devices
> typically contain a small-to-moderate amount of application code. The focus of this book, however, remains on
> embedded devices that use an RTOS. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> }
>  
> Because the tWaitTasks' priorities are higher than tSignalTask's priority, as soon as the semaphore is released, one of
> the higher priority tWaitTasks preempts tSignalTask and starts to execute. 
> Note that in the wait-and-signal synchronization shown in Figure 6.6 the value of the binary semaphore after the flush
> operation is implementation dependent. Therefore, the return value of the acquire operation must be properly

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> •
> allowing one task to control the execution of other tasks,
>  
> •
> synchronizing activities, and
>  
> •
> implementing custom synchronization protocols for resource sharing. 
> The first purpose of communication is for one task to transfer data to another task. Between the tasks, there can exist
> data dependency, in which one task is the data producer and another task is the data consumer. For example,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> semaphore can be used between two tasks to coordinate the transfer of execution control, as shown in Figure 6.5.
> Figure 6.5: Wait-and-signal synchronization between two tasks. 
> In this situation, the binary semaphore is initially unavailable (value of 0). tWaitTask has higher priority and runs first.
> The task makes a request to acquire the semaphore but is blocked because the semaphore is unavailable. This step

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> }
> tSignalTask ( )
> {
>                 :
>                 Release binary semaphore token
>                 :
> }
>  
> Because tWaitTask's priority is higher than tSignalTask's priority, as soon as the semaphore is released, tWaitTask
> preempts tSignalTask and starts to execute. 
> 6.4.2 Multiple-Task Wait-and-Signal Synchronization 
> When coordinating the synchronization of more than two tasks, use the flush operation on the task-waiting list of a
> binary semaphore, as shown in Figure 6.6.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Chapter 12:
>  I/O Subsystem
>  
> Listing 12.1: C structure defining the uniform I/O API set. Listing 12.2: Mapping uniform I/O API to specific driver
> functions. 
> Chapter 13:
>  Memory Management
>  
> Listing 13.1: Pseudo code for memory allocation. Listing 13.2: Pseudo code for memory deallocation. 
> Chapter 15:
>  Synchronization And Communication
>  
> Listing 15.1: Pseudo code for barrier synchronization. Listing 15.2: Pseudo code for data transfer with flow control.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> recognizing when an event occurs, performing the required processing as a result of the event, and outputting the
> necessary results within a given time constraint. Timing constraints include finish time, or both start time and finish time.
>  
> A good way to understand the relationship between real-time systems and embedded systems is to view them as two
> intersecting circles, as shown in Figure 1.6. It can be seen that not all embedded systems exhibit real-time behaviors

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> The concept of concurrency and how an application is optimally decomposed into concurrent tasks is also discussed
> in more detail later in this book. For now, remember that the task object is the fundamental construct of most kernels.
> Tasks, along with task-management services, allow developers to design applications for concurrency to meet
> multiple time constraints and to address various design problems inherent to real-time embedded applications.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** concurrency design, concurrency theory, real-time middleware

---

> Figure 6.6: Wait-and-signal synchronization between multiple tasks. 
> As in the previous case, the binary semaphore is initially unavailable (value of 0). The higher priority tWaitTasks 1, 2,
> and 3 all do some processing; when they are done, they try to acquire the unavailable semaphore and, as a result,
> block. This action gives tSignalTask a chance to complete its processing and execute a flush command on the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> queue, blocking again afterward on the binary semaphore. 
> The pseudo code for interlocked, one-way data communication is provided in Listing 7.2. 
> The semaphore in this case acts as a simple synchronization object that ensures that tSourceTask and tSinkTask are
> in lockstep. This synchronization mechanism also acts as a simple acknowledgement to tSourceTask that it s okay to
> send the next message. 
> 7.7.3 Interlocked, Two-Way Data Communication

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> 13.4 Blocking vs. Non-Blocking Memory Functions 
> The malloc and free functions do not allow the calling task to block and wait for memory to become available. In
> many real-time embedded systems, tasks compete for the limited system memory available. Oftentimes, the memory
> exhaustion condition is only temporary. For some tasks when a memory allocation request fails, the task must
> backtrack to an execution checkpoint and perhaps restart an operation. This issue is undesirable as the operation can

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems, real-time middleware

---

> T, which implies that tasks with a priority higher than T's do not require the resources currently in use. Consequently,
> none of the tasks that are holding resources in use can inherit a higher priority, preempt task T, and then request a
> resource that T holds. This feature prevents the circular-wait condition. This feature is also why deadlock cannot
> occur when using the priority ceiling protocol as an access control protocol. The same induction process shows that

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, deadlock, ceiling priority protocol

---

> Figure 5.3 illustrates, in a five-step scenario, how a kernel scheduler might use a task-ready list to move tasks from
> the ready state to the running state. This example assumes a single-processor system and a priority-based preemptive
> scheduling algorithm in which 255 is the lowest priority and 0 is the highest. Note that for simplicity this example does
> not show system tasks, such as the idle task. 
> Figure 5.3: Five steps showing the way a task-ready list works.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, idle task, scheduling theory

---

> the condition in which a task blocks another task but is in turn blocked by a third task, transitive blocking, does not
> occur under the priority ceiling protocol. 
> The priority ceiling protocol has these characteristics: 
> •
> A requesting task can be blocked by only one task; therefore, the blocking interval is at most the duration of
> one critical section. 
> •
> Transitive blocking never occurs under the priority ceiling protocol. 
> •
> Deadlock never occurs under the priority ceiling protocol.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, deadlock, ceiling priority protocol

---

> 7.8 Points to Remember 
> Some points to remember include the following: 
> •
> Message queues are buffer-like kernel objects used for data communication and synchronization between
> two tasks or between an ISR and a task. 
> •
> Message queues have an associated message queue control block (QCB), a name, a unique ID, memory
> buffers, a message queue length, a maximum message length, and one or more task-waiting lists. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> scheduling delay also includes the amount of time needed to perform a context switch after the daemon task is moved
> from the ready queue to the run queue. 
> In conclusion, the duration of the ISR running in the context of the interrupt depends on the number of interrupts and
> the frequency of each interrupt source existing in the system. Although general approaches to designing an ISR exist,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, spurious interrupts, scheduling theory

---

> timers of varying timeout values. Most embedded systems use two different forms of timers to drive time-sensitive
> activities: hard timers and soft timers. Hard timers are derived from physical timer chips that directly interrupt the
> processor when they expire. Operations with demanding requirements for precision or latency need the predictable
> performance of a hard timer. Soft timers are software events that are scheduled through a software facility.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, spurious interrupts, performance engineering

---

> semaphore and a mutex lock. These synchronization primitives are created for each memory pool and are kept in the
> control structure. The counting semaphore is initialized with the total number of available memory blocks at the
> creation of the memory pool. Memory blocks are allocated and freed from the beginning of the list. 
> Figure 13.7: Implementing a blocking allocation function using a mutex and a counting semaphore.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> 15.2 Synchronization 
> Synchronization is classified into two categories: resource synchronization and activity synchronization . Resource
> synchronization determines whether access to a shared resource is safe, and, if not, when it will be safe. Activity
> synchronization determines whether the execution of a multithreaded program has reached a certain state and, if it
> hasn't, how to wait for and be notified when this state is reached. 
> 15.2.1 Resource Synchronization

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Figure 15.14: ISR-to-task resource synchronization- shared memory guarded by interrupt lock. 
> Shared Memory with Preemption Locks 
> In this design pattern, two tasks transfer data to each other using shared memory, as shown in Figure 15.15. Each
> task is responsible for disabling preemption before accessing the shared memory. Unlike using a binary semaphore or
> a mutex lock, no waiting is invovled when using a preemption lock for synchronization.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, spurious interrupts, resource synchronization

---

> task resume execution. 
> Figure 15.9: ISR-to-task synchronization using event registers. 
> ISR-to-Task Synchronization Using Counting Semaphores 
> In Figures 15.6, 15.7, 15.8, and 15.9, multiple occurrences of the same event cannot accumulate. A counting
> semaphore, however, is used in Figure 15.10 to accumulate event occurrences and for task signaling. The value of
> the counting semaphore increments by one each time the ISR gives the semaphore. Similarly, its value is decremented

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> of ownership, it ensures that only the task that successfully acquired (locked) the mutex can release (unlock) it. 
> 6.4.5 Recursive Shared-Resource-Access Synchronization 
> Sometimes a developer might want a task to access a shared resource recursively. This situation might exist if
> tAccessTask calls Routine A that calls Routine B, and all three need access to the same shared resource, as shown in 
> Figure 6.9. 
> Figure 6.9: Recursive shared- resource-access synchronization.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> •
> a task posts its arrival at the barrier, 
> •
> the task waits for other participating tasks to reach the barrier, and 
> •
> the task receives notification to proceed beyond the barrier.
>  
> A later section of this chapter shows how to implement barrier synchronization using mutex locks and condition
> variables. 
> As shown in Figure 15.2, a group of five tasks participates in barrier synchronization. Tasks in the group complete

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> ISR-to-Task Synchronization Using Binary Semaphores 
> In this design pattern, a task and an ISR synchronize their activities using a binary semaphore, as shown in Figure 15.7
> . The initial value of the binary semaphore is 0. The task has to wait for the ISR to signal the occurrence of an
> asynchronous event. When the event occurs and the associated ISR runs, it signals to the task by giving the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> This requirement can be useful for reliable communications or task synchronization. For example, if the message for
> some reason is not received correctly, the sending task can resend it. Using interlocked communication can close a
> synchronization loop. To do so, you can construct a continuous loop in which sending and receiving tasks operate in
> lockstep with each other. An example of one-way, interlocked data communication is illustrated in Figure 7.7.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> the file being compiled. Consequently, these addresses are generated with respect to offset 0. The symbol table
> contains the global symbols defined in the file being compiled, as well as the external symbols referenced in the file
> that the linker needs to resolve. The linking process performed by the linker involves symbol resolution and symbol
> relocation. 
> Symbol resolution is the process in which the linker goes through each object file and determines, for the object file,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** linker and linking process, symbol resolution and relocation

---

> The focus of this chapter is
>  
> •
> image transfer from the host to the target system,
>  
> •
> the embedded monitor and debug agent,
>  
> •
> the target system loader,
>  
> •
> the embedded system booting process,
>  
> •
> various initialization procedures, and
>  
> •
> an introduction to BDM and JTAG interfaces. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** target debug agent, jtag and bdm interfaces

---

> •
> preemptive priority-based scheduling, and 
> •
> round-robin scheduling.
>  
> The RTOS manufacturer typically predefines these algorithms; however, in some cases, developers can create and
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, preemptive priority-based scheduling and round-robin

---

> The vector address column specifies where in memory the ISR must be installed. The processor automatically fetches
> the instruction from one of these known addresses based on the interrupt number, which is specified in the IRQ
> column. This instruction begins the interrupt-specific service routine. In this example, the interrupt table contains a
> vector address column, but these values are dependent on processor and hardware design. In some designs, a

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** irq vector table and vector addresses, spurious interrupts

---

> no one solution exists to implement an ISR so that it works in all embedded designs. Rather the embedded systems
> developer must design an ISR according to the considerations discussed in this section. 
> General Guides 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, nested interrupts and stack considerations

---

> Ideally, the timer facility could guarantee an upper bound; for example, regardless of the number of timers already
> installed in the system, event handler n is invoked no later than 200ms from the actual expiration time. 
> This problem is difficult, and the solution is application specific. 
> 11.6.2 Hierarchical Timing Wheels 
> The timer overflow problem presented in the last section can be solved using the hierarchical timing wheel
> approach.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing wheel and hierarchical timing wheels, timing wheel and hierarchical timing wheel

---

> hierarchy wraps around. Using a hierarchical timing wheel requires only 75 (10 + 60 + 5) entries to allow for
> timeouts with 100ms resolution and duration of up to 5 minutes. 
> With a hierarchical timing wheels, there are multiple arrays, therefore 
> 10 ? 100ms = 1 sec
> 10 entries/sec
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing wheel and hierarchical timing wheels, timing wheel and hierarchical timing wheel

---

> 11.7 Soft Timers and Timer Related Operations 
> Many RTOSs provide a set of timer-related operations for external software components and applications through
> API sets. These common operations can be cataloged into these groups: 
> •
> group 1-provides low-level hardware related operations, 
> •
> group 2-provides soft-timer-related services, and 
> •
> group 3-provides access either to the storage of the real-time clock or to the system clock.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timer services and soft timers, real-time middleware

---

> In many cases, memory management systems should also be concerned with architecture-specific memory alignment
> requirements. Memory alignment refers to architecture-specific constraints imposed on the address of a data item in
> memory. Many embedded processor architectures cannot access multi-byte data items at any address. For example,
> some architecture requires multi-byte data items, such as integers and long integers, to be allocated at addresses that

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, memory alignment and architecture constraints

---

> •
> aperiodic tasks are limited to initialization and failure recovery work and that these aperiodic tasks do not
> have hard deadlines. 
> 14.4.1 Basic RMA Schedulability Test 
> Equation 14.1 is used to perform the basic RMA schedulability test on a system.
>  
> Ci = worst-case execution time associated with periodic task I 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** schedulability analysis, utilization bounds and schedulability tests

---

> using an interrupt lock. The priority inversion, however, is bounded. Chapter 16 discusses priority inversion in detail. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, spurious interrupts

---

> •
> deadlock detection, recovery, avoidance and prevention, 
> •
> definition of priority inversion, and 
> •
> solutions to priority inversion. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, deadlock

---

> In the ceiling priority protocol, the priority of every task is known, as are the resources required by every task. For a
> given resource, the priority ceiling is the highest priority of all possible tasks that might require the resource. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> Index
>  
> H 
> handshake 107 
> hard real-time system 14-16 
> hard timer 167 
> heap 200, 205, 207, 209 
> array 206-207 
> data structure 205-206 
> hierarchical timing wheel 180-181 
> hook 73 
> host system 8, 19-20, 27, 35-37, 39, 42, 46- 47, 137 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing wheel and hierarchical timing wheel, real-time middleware

---

> priority promotion example. Figure 16.10: Ceiling priority protocol example. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> Table 8.1: Create and destroy operations. Table 8.2: Read and write operations. Table 8.3: Control operations.
> Table 8.4: Select operations. Table 8.5: Event register operations. Table 8.6: Signal operations. Table 8.7: Condition
> variable operations. 
> Chapter 10:
>  Exceptions and Interrupts
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> to run. 
> Guideline 5: Identify Functional Cohesion 
> Functional cohesion requires collecting groups of functions or sequences of code that perform closely related
> activities into a single task. In addition, if two tasks are closely coupled (pass lots of data between each other), they
> should also be considered for combination into one task. Grouping these closely related or closely coupled activities
> into a singe task can help eliminate synchronization and communication overhead.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> 15.7 Specific Solution Design Patterns 
> This section presents more complex design patterns for synchronization and communication. Multiple synchronization
> primitives can be found in a single design pattern. 
> 15.7.1 Data Transfer with Flow Control 
> Task-to-task communication commonly involves data transfer. One task is a producer, and the other is a data
> consumer. Data processing takes time, and the consumer task might not be able to consume the data as fast as the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Figure 4.3: Multitasking using a context switch. 
> In this scenario, the kernel multitasks in such a way that many threads of execution appear to be running concurrently;
> however, the kernel is actually interleaving executions sequentially, based on a preset scheduling algorithm (see 
> Scheduling Algorithms  on page 59). The scheduler must ensure that the appropriate task runs at the right time.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, multitasking, scheduling theory

---

> semaphore and changing the value of the binary semaphore to 1. The ISR runs to completion before the task gets the
> chance to resume execution. The value of the binary semaphore is reset to 0 after the task resumes execution. 
> Figure 15.7: ISR-to-task synchronization using binary semaphores. 
> Task-to-Task Synchronization Using Event Registers 
> In this design pattern, two tasks synchronize their activities using an event register, as shown in Figure 15.8. The tasks

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> The implementation that follows can be adapted to other types of synchronization scenarios when prioritized access
> to shared resources is desired, as shown in Listings 15.7, 15.8, and 15.9. 
> The following assumptions are made in the program listings: 
> 1.
> The mutex_t data type represents a mutex object and condvar_t represents a condition variable object; both
> are provided by the RTOS. 
> 2.
> lock_mutex, unlock_mutex, wait_cond, signal_cond, and broadcast_cond are functions provided by the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> frame 151, 158 
> service routine 145, 152, 158 
> Executable and Linking Format
> See ELF 
> executable image 20-25, 27-32, 34-36, 41, 140 
> External Data Representation
> See XDR 136 
> external fragmentation 201 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> that the device is now ready to accept more commands. This method of hardware concurrency and use of external
> interrupts is common in embedded design. 
> Another use of external interrupts is to provide a communication mechanism to signal or alert an embedded
> processor that an external hardware device is requesting service. For example, an initialized programmable interval
> timer chip communicates with the embedded processor through an interrupt when a preprogrammed time interval has

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, concurrency design, concurrency theory

---

> possible to avoid possible conflicts. 
> 16.4.3 Priority Ceiling Protocol 
> Similarly to the ceiling priority protocol, the priority of every task is known in the priority ceiling protocol. The
> resources that every task requires are also known before execution. The current priority ceiling for a running
> system at any time is the highest priority ceiling of all resources in use at that time.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> 6.4.4 Single Shared-Resource-Access Synchronization
>  
> One of the more common uses of semaphores is to provide for mutually exclusive access to a shared resource. A
> shared resource might be a memory location, a data structure, or an I/O device-essentially anything that might have to
> be shared between two or more concurrent threads of execution. A semaphore can be used to serialize access to a
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> internal fragmentation 200, 209 
> interrupt 143-165 
> latency 161, 168 
> lock 238-240, 245-246, 248, 250 
> mask register 160 
> nested 147, 155-156, 246 
> overhead 168 
> request line
> See IRQ 
> response time 161, 163 
> service routine 58-59, 86, 90, 97, 102, 106, 124, 147, 149, 152, 160-161, 168, 170-171, 182, 240, 246 
> software 121-126 
> stack 151, 158 
> table 147-148, 152 
> interrupt request line 147 
> IP 43, 183, 217 
> IRQ 147, 159, 193 
> ISDN 134 
> ISO 9660 135

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, internal fragmentation, external fragmentation

---

> 5.7 Points to Remember
>  
> Some points to remember include the following: 
> •
> Most real-time kernels provide task objects and task-management services that allow developers to meet the
> requirements of real-time applications. 
> •
> Applications can contain system tasks or user-created tasks, each of which has a name, a unique ID, a
> priority, a task control block (TCB), a stack, and a task routine. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** task control block (tcb), real-time middleware

---

> synchronization primitive. An unrelated print server daemon task runs at a much higher priority; however, the printer
> daemon cannot send a command to the printer to eject one page and feed the next while either of the medium tasks is
> inside the critical section. This issue results in garbled output or output mixed from multiple print jobs. 
> The benefit of preemption locking is that it allows the accumulation of asynchronous events instead of deleting them.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> kernel-provided calls. The ability to change task priorities dynamically allows an embedded application the flexibility
> to adjust to external events as they occur, creating a true real-time, responsive system. Note, however, that misuse of
> this capability can lead to priority inversions, deadlock, and eventual system failure. 
> Round-Robin Scheduling 
> Round-robin scheduling provides each task an equal share of the CPU execution time. Pure round-robin scheduling

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, deadlock, scheduling theory

---

> Static RAM
> See SRAM 
> status register 152, 160 
> stray pointer 145 
> stubs 135 
> supervisor stack 153 
> suspended 67-68, 73, 75 
> symbol
> relocation 22-23 
> resolution 22, 24, 28 
> table 23 
> symbol resolution 22 
> synchronization 57, 61, 77, 79, 87-94, 107, 111, 117, 120, 125, 133, 209, 211, 213, 225, 227, 231-236 
> synchronous 10, 149-150, 219-221 
> exception 144, 149-150, 155, 160 
> system call 59, 63, 137 
> system clock 168-169, 171, 182, 184 
> system reset exception 144 
> system-on-a-chip
> See SoC

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> •
> synchronous-imprecise.
>  
> Asynchronous exceptions are classified into maskable and non-maskable exceptions. External interrupts are
> asynchronous exceptions. Asynchronous exceptions that can be blocked or enabled by software are called maskable
> exceptions. Similarly, asynchronous exceptions that cannot be blocked by software are called non-maskable
> exceptions. Non-maskable exceptions are always acknowledged by the processor and processed immediately.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> mechanism called Rate Monotonic Scheduling (RMS), which is the preemptive scheduling algorithm with rate
> monotonic priority assignment as the task priority assignment policy. Rate monotonic priority assignment is the
> method of assigning a task its priority as a monotonic function of the execution rate of that task. In other words, the
> shorter the period between each execution, the higher the priority assigned to a task.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** rate monotonic scheduling (rms), scheduling theory

---

> A derivative form of rendezvous synchronization, called simple rendezvous in this book, uses kernel primitives, such
> as semaphores or message queues, instead of the entry call to achieve synchronization. Two tasks can implement a
> simple rendezvous without data passing by using two binary semaphores, as shown in Figure 15.3.
> Figure 15.3: Simple rendezvous without data passing. 
> Both binary semaphores are initialized to 0 . When task #1 reaches the rendezvous, it gives semaphore #2, and then

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** rendezvous synchronization, simple rendezvous using message queues

---

> Sometimes the rate at which the signaling task executes is higher than that of the signaled task. In this case, a
> mechanism is needed to count each signaling occurrence. The counting semaphore provides just this facility. With a
> counting semaphore, the signaling task can continue to execute and increment a count at its own pace, while the wait
> task, when unblocked, executes at its own pace, as shown in Figure 6.7.
> Figure 6.7: Credit-tracking synchronization between two tasks.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> collected from the various tasks for the final calculation. The result determines what other partial computations each
> task is to perform next. 
> The point at which the partial results are collected and the duration of the final computation is a barrier . One task
> can finish its partial computation before other tasks complete theirs, but this task must wait for all other tasks to
> complete their computations before the task can continue. 
> Barrier synchronization comprises three actions: 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> If more tasks are to arrive, the caller waits at the barrier (the blocking wait on the condition variable at line #5). If the
> caller is the last task of the group to enter the barrier, this task resets the barrier on line #6 and notifies all other tasks
> that the barrier synchronization is complete. Broadcasting on the condition variable on line #7 completes the barrier
> synchronization. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Event registers are typically used for unidirectional activity synchronization. It is unidirectional because the issuer of
> the receive operation determines when activity synchronization should take place. Pending events in the event register
> do not change the execution state of the receiving task. 
> In following the diagram, at the time task 1 sends the event X to task 2, no effect occurs to the execution state of task
> 2 if task 2 has not yet attempted to receive the event.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Chapter 10: Exceptions and
> Interrupts
>  
> 10.1 Introduction
>  
> Exceptions and interrupts are part of a mechanism provided by the majority of embedded processor architectures to
> allow for the disruption of the processor's normal execution path. This disruption can be triggered either intentionally
> by application software or by an error, unusual condition, or some unplanned external event.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> 10.4 A Closer Look at Exceptions and Interrupts 
> General exceptions have classifications and are prioritized based on the classifications. It is possible there exists
> another level of priorities, imposed and enforced by the interrupt hardware, among the external interrupts.
> Understanding the hardware sources that can trigger general exceptions, the hardware that implements the transfer of

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> If another task without a competing critical section exists in the system but does have real-time deadlines to meet, the
> task must be allowed to interrupt either of the other two tasks, regardless of whether the task to be interrupted is in
> its critical section, in order to guarantee overall system correctness. Therefore, in this particular example, the duration
> of the critical sections of the first two tasks can be long, and higher priority task should be allowed to interrupt.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** critical sections, spurious interrupts, real-time middleware

---

> 8.2 Pipes
>  
> Pipes are kernel objects that provide unstructured data exchange and facilitate synchronization among tasks. In a
> traditional implementation, a pipe is a unidirectional data exchange facility, as shown in Figure 8.1. Two descriptors,
> one for each end of the pipe (one end for reading and one for writing), are returned when the pipe is created. Data is
> written via one descriptor and read via the other. The data remains in the pipe as an unstructured byte stream. Data is

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> Figure 15.8: Task-to-task synchronization using event registers. 
> ISR-to-Task Synchronization Using Event Registers 
> In this design pattern, a task and an ISR synchronize their activities using an event register, as shown in Figure 15.9.
> The task and the ISR agree on an event bit location for signaling. In this example, the bit location is the first bit. The
> initial value of the event bit is 0. The task has to wait for the ISR to signal the occurrence of an asynchronous event.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** intertask synchronization, resource synchronization, barrier synchronization

---

> •
> the definitions of exception and interrupt, 
> •
> the applications of exceptions and interrupts, 
> •
> a closer look at exceptions and interrupts in terms of hardware support, classifications, priorities, and causes
> of spurious interrupts, and 
> •
> a detailed discussion on how to handle exceptions and interrupts. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> sequence control 233 
> sequential 65, 222 
> cohesion 219, 225, 229 
> services 56, 62, 133-141, 150-163, 167-185 
> signal 121-126 
> control block 122-123 
> facility 125, 244 
> glitch 163 
> handler 122, 124-125, 255 
> Simple Network Management Protocol
> See SNMP 
> SNMP 134 
> SoC 7 
> soft real-time system 14 
> soft timer 171 
> soft-timer facility
> See timer facility 
> software interrupt 121-126 
> sporadic 158, 164 
> spurious interrupt 163-165 
> SRAM 9 
> stable deadlock 263 
> stack overflow 156-158

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** deadlock, spurious interrupts, real-time middleware

---

> between tasks. These context switches do not take place because the ISR must complete without being interrupted
> by tasks. After the ISR completes execution, the kernel exits through the dispatcher so that it can then dispatch the
> correct task. 
> 4.4.5 Scheduling Algorithms 
> As mentioned earlier, the scheduler determines which task runs by following a scheduling algorithm (also known as
> scheduling policy). Most kernels today support two common scheduling algorithms: 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, dispatcher, scheduling theory

---

> 3.5 On-Chip Debugging
>  
> Many silicon vendors recognize the need for built-in microprocessor debugging, called on-chip debugging (OCD).
> BDM and JTAG are two types of OCD solutions that allow direct access and control over the microprocessor and
> system resources without needing software debug agents on the target or expensive in-circuit emulators. As shown in 
> Figure 3.1, the embedded processor with OCD capability provides an external interface. The developer can use the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** target debug agent, on-chip debugging (ocd)

---

> 16.5 Points to Remember 
> Some points to remember include the following: 
> •
> Resources can be classified as either preemptible or non-preemptible resources. 
> •
> Deadlock occurs when all four of these conditions are true: mutual exclusion, no preemption, hold-and-wait,
> and circular wait. 
> •
> Resource requests can be classified into Single, AND, OR, and AND-OR request models. 
> •
> Strategies exist for dealing with deadlocks: deadlock detection and recovery, deadlock avoidance, and
> deadlock prevention.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, mutual exclusion, deadlock

---

> •
> current trends in embedded systems.
>  
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems

---

> task-scheduling delays. Figure 11.8: Maintaining soft timers. Figure 11.9: Unsorted soft timers. Figure 11.10: Sorted
> soft timers. Figure 11.11: Timing wheel. Figure 11.12: Timeout event handlers. Figure 11.13: Installing a timeout
> event. Figure 11.14: Timing wheel overflow event buffer. Figure 11.15: Unbounded soft-timer handler invocation.
> Figure 11.16: A hierarchical timing wheel. 
> Chapter 12:
>  I/O Subsystem

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing wheel and hierarchical timing wheel

---

> debugger information between the host debugger and the target debug agent.
>  
> Programs including the system software, the real-time operating system (RTOS), the kernel, and the application code
> must be developed first, compiled into object code, and linked together into an executable image. Programmers
> writing applications that execute in the same environment as used for development, called native development, do

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** target debug agent, real-time middleware

---

> Potential for deadlocks exist in a system in which the underlying RTOS permits resource sharing among multiple
> threads of execution. Deadlock occurs when the following four conditions are present: 
> Mutual exclusion-A resource can be accessed by only one task at a time, i.e., exclusive access mode. 
> No preemption-A non-preemptible resource cannot be forcibly removed from its holding task. A resource becomes
> available only when its holder voluntarily relinquishes claim to the resource.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, mutual exclusion, deadlock

---

> Deadlock prevention is a set of constraints and requirements constructed into a system so that resource requests
> that might lead to deadlocks are not made. Deadlock prevention differs from deadlock avoidance in that no run-time
> validation of resource allocation requests occurs. Deadlock prevention focuses on structuring a system to ensure that
> one or more of the four conditions for deadlock i.e., mutual exclusion, no preemption, hold-and-wait, and circular
> wait is not satisfied.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, mutual exclusion, deadlock

---

> work. 
> •
> A higher priority interrupt is active at the time. 
> •
> The interrupt is disabled and then later re-enabled by software.
>  
> The first case is always a contributing factor to interrupt latency. As can be seen, interrupt latency can be unbounded.
> Therefore, the response time can also be unbounded. The interrupt latency is outside the control of the ISR. The
> processing time TC, however, is determined by how the ISR is implemented. 
> The interrupt response time is TD = TB + TC.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupt latency and response time, spurious interrupts

---

> The problem with preemption locking is that higher priority tasks cannot execute, even when they are totally unrelated
> to the critical section that the preemption lock is guarding. This process can introduce indeterminism in a similar
> manner to that caused by the interrupt lock. This indeterminism is unacceptable to many systems requiring consistent
> real-time response. 
> For example, consider two medium-priority tasks that share a critical section and that use preemption locking as the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** determinism, spurious interrupts, real-time middleware

---

> Enabling certain protocols that are typically built into mutexes can help avoid priority inversion. Two common
> protocols used for avoiding priority inversion include: 
> •
> priority inheritance protocol ensures that the priority level of the lower priority task that has acquired the
> mutex is raised to that of the higher priority task that has requested the mutex when inversion happens. The

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol

---

> programmable interrupt controller (PIC) is required. 
> The PIC is implementation-dependent. It can appear in a variety of forms and is sometimes given different names,
> however, all serve the same purpose and provide two main functionalities: 
> •
> Prioritizing multiple interrupt sources so that at any time the highest priority interrupt is presented to the core
> CPU for processing. 
> •
> Offloading the core CPU with the processing required to determine an interrupt's exact source.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** programmable interrupt controller (pic), spurious interrupts

---

> Event Dispatch Device I/O
> Task 
> Assigned for dispatching events to other tasks from one or more I/O devices. 
> Recommendation 1: Assign separate tasks for separate active asynchronous I/O devices. Active I/O
> devices that interact with real-time applications do so at their own rate. Each hardware device that uses interrupts to
> communicate with an application and whose operation is asynchronous with respect to other I/O devices should be
> considered to have their own separate tasks.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** dispatcher, spurious interrupts, real-time middleware

---

> discusses the MMU's memory protection feature, as many RTOSes do support it. 
> If an MMU is enabled on an embedded system, the physical memory is typically divided into pages. A set of
> attributes is associated with each memory page. Information on attributes can include the following: 
> •
> whether the page contains code (i.e., executable instructions) or data, 
> •
> whether the page is readable, writable, executable, or a combination of these, and 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** memory protection with mmu and page attributes

---

> expired. (Chapter 11 discusses programmable interval timers in detail.) Similarly, the network interface device uses
> an interrupt to indicate the arrival of packets after the received packets have been stored into memory. 
> The capabilities of exceptions and their close cousins, external interrupts, empower embedded designs. Applying the
> general exception facility to an embedded design, however, requires properly handling general exceptions according

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> Other RTOS Services
>  
> Figure 9.1: Overview. Figure 9.2: TCP/IP protocol stack component. Figure 9.3: File system component. Figure 9.4:
> Remote procedure calls. Figure 9.5: RTOS command shell. 
> Chapter 10:
>  Exceptions and Interrupts
>  
> Figure 10.1: Programmable interrupt controller. Figure 10.2: System-wide priority scheme. Figure 10.3: Store
> processor state information onto stack. Figure 10.4: Task TCB and stack. Figure 10.5: Loading exception vector.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> memory. See Chapter 10 for detailed discussions on interrupts, exceptions, and exception vectors and handlers.
> Figure 3.2: Example bootstrap overview. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions

---

> the target debug agent. With a host debugger, the user can debug the target system without having to understand the
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** target debug agent

---

> sections into different target memory areas as shown in the last example. The following sections list some of these
> reasons. 
> Module Upgradeability
>  
> Chapter 1 discusses the storage options and upgradability of software on embedded systems. Software can be easily
> upgraded when stored in non-volatile memory devices, such as flash devices. It is possible to upgrade the software
> dynamically while the system is still running. Upgrading the software can involve downloading the new program image

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, non-volatile storage and upgradeability

---

> execution. This practice is typical during the later development phases when the majority of the device drivers have
> been fully implemented and debugged. The system can handle interrupts and exceptions correctly. At this stage, the
> target system facilitates a stable environment for further application development, allowing the embedded developer
> to focus on application design and implementation rather than the low-level hardware details.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> makes embedded systems special. 
> 1.1.5 Embedded Processor and Application Awareness
>  
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems

---

> Each task has its own context, which is the state of the CPU registers required each time it is scheduled to run. A
> context switch occurs when the scheduler switches from one task to another. To better understand what happens
> during a context switch, let s examine further what a typical kernel does in this scenario. 
> Every time a new task is created, the kernel also creates and maintains an associated task control block (TCB).

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** task control block (tcb), context switch

---

> 10.5 Processing General Exceptions 
> Having introduced the fundamentals of exceptions and external interrupts, it is time to discuss processing exceptions
> and external interrupts. The overall exception handling mechanism is similar to the mechanism for interrupt handling.
> In a simplified view, the processor takes the following steps when an exception or an external interrupt is raised: 
> •
> Save the current processor state information. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> Hardware-reset exceptions are always non-maskable exceptions. Many embedded processors have a dedicated
> non-maskable interrupt (NMI) request line. Any device connected to the NMI request line is allowed to generate an
> NMI. 
> External interrupts, with the exception of NMIs, are the only asynchronous exceptions that can be disabled by
> software. 
> Synchronous exceptions can be classified into precise and imprecise exceptions. With precise exception s, the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> a predefined scheduling algorithm. A task is defined by its distinct set of parameters and supporting data structures.
> Specifically, upon creation, each task has an associated name, a unique ID, a priority (if part of a preemptive
> scheduling plan), a task control block (TCB), a stack, and a task routine, as shown in Figure 5.1). Together, these
> components make up what is known as the task object. 
> Figure 5.1: A task, its associated parameters, and supporting data structures.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** task control block (tcb), scheduling theory

---

> 10.3 Applications of Exceptions and Interrupts 
> From an application's perspective, exceptions and external interrupts provide a facility for embedded hardware
> (either internal or external to the processor) to gain the attention of application code. Interrupts are a means of
> communicating between the hardware and an application currently running on an embedded processor. 
> In general, exceptions and interrupts help the embedded engineer in three areas: 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> This access control protocol is shown in Figure 16.8. 
> Figure 16.8: Priority inheritance protocol example. 
> With the priority inheritance protocol, when the LP-task blocks the HP-task at time t3, the execution priority is
> raised to that of the HP-task. This process ensures that unrelated medium-priority tasks cannot interfere while the
> LP-task executes, which results in the elimination of the unbounded priority inversion. When the LP-task releases

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, priority inheritance protocol

---

> and a real-time clock. 
> Figure 10.1: Programmable interrupt controller. 
> Figure 10.1 translates into an interrupt table that captures this information more concisely. The interrupt table lists all
> available interrupts in the embedded system. In addition, several other properties help define the dynamic
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> priority of the raised task is lowered to its original value after the task releases the mutex that the higher
> priority task requires. 
> •
> ceiling priority protocol ensures that the priority level of the task that acquires the mutex is automatically set
> to the highest priority of all possible tasks that might request that mutex when it is first acquired until it is
> released. 
> When the mutex is released, the priority of the task is lowered to its original value.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> not store identifiers for the contents. Stack users are required to push and pop items onto and off the stack in a
> symmetric order. If this rule is not followed during exception or interrupt processing, unintended results are likely to
> occur. 
> As Chapter 5 discusses, in an embedded operating system environment, all task objects have a task control block
> (TCB). During task creation, a block of memory is reserved as a stack for task use, as shown in Figure 10.4.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** task control block (tcb), spurious interrupts

---

> For example, if a resource R is required by four tasks (T1 of priority 4, T2 of priority 9, T3 of priority 10, and T4 of
> priority 8), the priority ceiling of R is 10, which is the highest priority of the four tasks. 
> This access control protocol follows the rules in Table 16.2 when a task T requests a resource R. 
> Table 16.2: Ceiling priority protocol rules. 
> Rule # Description 
> 1 If R is in use, T is blocked.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> Figure 13.3: Static array implementation of the allocation map. Figure 13.4: Free blocks in a heap arrangement.
> Figure 13.5: The free operation. Figure 13.6: Management based on memory pools. Figure 13.7: Implementing a
> blocking allocation function using a mutex and a counting semaphore. 
> Chapter 14:
>  Modularizing An Application For
> Concurrency
>  
> Figure 14.1: High-level context diagram of a mobile handheld unit. Figure 14.2: Using the outside-in approach to

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** heap array implementation, concurrency theory

---

> enters its critical section and re-enables the preemption when finished. The executing task cannot be preempted while
> the preemption lock is in effect. 
> On the surface, preemption locking appears to be more acceptable than interrupt locking. Closer examination reveals
> that preemption locking introduces the possibility for priority inversion. Even though interrupts are enabled while

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, spurious interrupts

---

> For example, if four resources are in use and if R1 has a priority ceiling of 4, R2 has a priority ceiling of 9, R3 of a
> priority ceiling 10, and R4 of a priority ceiling 8, the current priority ceiling of the system is 10. Note that different
> tasks can hold these resources. 
> This access control protocol follows the rules in Table 16.3 when a task T requests a resource R. 
> Table 16.3: Priority ceiling protocol rules. 
> Rule # Description

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> Chapter 5: Tasks
>  
> 5.1 Introduction
>  
> Simple software applications are typically designed to run sequentially , one instruction at a time, in a pre-determined
> chain of instructions. However, this scheme is inappropriate for real-time embedded applications, which generally
> handle multiple inputs and outputs within tight time constraints. Real-time embedded software applications must be
> designed for concurrency.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** concurrency design, real-time middleware

---

> 10.3.2 Hardware Concurrency and Service Request Management 
> The ability to perform different types of work simultaneously is important in embedded systems. Many external
> hardware devices can perform device-specific operations in parallel to the core processor. These devices require
> minimum intervention from the core processor. The key to concurrency is knowing when the device has completed

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, concurrency theory

---

> extremely important because during the development phase the program under construction is incomplete and is
> being constantly updated. As such, this program might not be able to handle certain system interrupts and exceptions.
> It is beneficial to have the monitor conduct default processing in such cases. For example, a program avoids
> processing memory access exceptions by not installing an exception handler for it. In this case, the monitor takes

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> 4.8 Points to Remember 
> Some points to remember include the following: 
> •
> RTOSes are best suited for real-time, application-specific embedded systems; GPOSes are typically used
> for general-purpose systems. 
> •
> RTOSes are programs that schedule execution in a timely manner, manage system resources, and provide a
> consistent foundation for developing application code. 
> •
> Kernels are the core module of every RTOS and typically contain kernel objects, services, and scheduler. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, real-time embedded systems

---

> resource whose priority ceiling is higher than or equal to T's priority. The task then returns to its previous
> priority. 
> In the priority ceiling protocol, a requesting task can be blocked for one of three causes. The first cause is when the
> resource is current in use, which is direct resource contention blocking, and is the result of rule #1. The second
> cause is when the blocking task has inherited a higher priority and its current execution priority is higher than that of

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority ceiling protocol, ceiling priority protocol

---

> Tips on section allocation include the following:
>  
> •
> allocate sections according to size to fully use available memory, and
>  
> •
> examine the nature of the underlying physical memory, the attributes, and the purpose of a section to
> determine which physical memory is best suited for allocation. 
> 2.4.2 Mapping Executable Images
>  
> Various reasons exist why an embedded developer might want to define custom sections, as well as to map these

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** memory map and mapping executable images

---

> Over the years, many versions of operating systems evolved. These ranged from general-purpose operating systems
> (GPOS), such as UNIX and Microsoft Windows, to smaller and more compact real-time operating systems, such as
> VxWorks. Each is briefly discussed next. 
> In the 60s and 70s, when mid-sized and mainframe computing was in its prime, UNIX was developed to facilitate
> multi-user access to expensive, limited-availability computing systems. UNIX allowed many users performing a

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** soft real-time systems, real-time middleware

---

> Because one or a few missed deadlines do not have a detrimental impact on the operations of soft real-time systems,
> a soft real-time system might not need to predict if a pending deadline might be missed. Instead, the soft real-time
> system can begin a recovery process after a missed deadline is detected. 
> For example, using the real-time DVD player, after a missed deadline is detected, the decoders in the DVD player

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** soft real-time systems, real-time middleware

---

> 15.14: ISR-to-task resource synchronization- shared memory guarded by interrupt lock. Figure 15.15: Task-to-task
> resource synchronization-shared memory guarded by preemption lock. Figure 15.16: Sharing multiple instances of
> resources using counting semaphores and mutexes. Figure 15.17: Using counting semaphores for flow control. Figure
> 15.18: Task waiting on multiple input sources. Figure 15.19: Task with multiple input communication channels. Figure

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, resource synchronization

---

> List of Listings
>  
> Chapter 2:
>  Basics Of Developing For Embedded
> Systems
>  
> Listing 2.1: Section header and program header. Listing 2.2: Memory map. Listing 2.3: SECTION command. Listing
> 2.4: Example code. Listing 2.5: Possible section allocation. 
> Chapter 5:
>  Tasks
>  
> Listing 5.1: Pseudo code for a run-to-completion task. Listing 5.2: Pseudo code for an endless-loop task. 
> Chapter 6:
>  Semaphores

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, run-to-completion tasks

---

> the table at this index or offset reflects the address of a service routine. The program counter is initialized with this
> vector address, and execution begins at this location. Before examining the general approach to an exception handler,
> let's first examine nested interrupts and their effect on the stack. 
> 10.5.4 Nested Exceptions and Stack Overflow 
> Nested exceptions refer to the ability for higher priority exceptions to preempt the processing of lower priority

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> 10.7 Points to Remember 
> Some points to remember include the following: 
> •
> Exceptions are classified into synchronous and asynchronous exceptions. 
> •
> Exceptions are prioritized. 
> •
> External interrupts belong to the category of asynchronous exceptions. 
> •
> External interrupts are the only exceptions that can be disabled by software. 
> •
> Exceptions can be nested. 
> •
> Using a dedicated exception frame is one solution to solving the stack overflow problem that nested
> exceptions cause. 
> •

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> This new free block is still considered memory fragmentation if future allocations are potentially larger than 64 bytes.
> Therefore, memory compaction continues until all of the free blocks are combined into one large chunk. 
> Figure 13.2: Memory allocation map with possible fragmentation. 
> Several problems occur with memory compaction. It is time-consuming to transfer memory content from one location

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> time slicing 60-61 
> timer
> See Chapter 11 
> timer chip 169 
> timer facility 171-176 
> timer interrupt 170 
> rate register 170 
> timer services
> See Chapter 11 
> timing
> anomaly 275 
> correctness 13, 15-16 
> wheel 176, 179-182 
> hierarchical 180 
> TRAP 145 
> triggering mechanism 160, 164 
> Trivial File Transfer Protocol
> See TFTP 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing correctness, spurious interrupts

---

> s execution. The difference between a signal and a normal interrupt is that signals are so-called software interrupts,
> which are generated via the execution of some software within the system. By contrast, normal interrupts are usually
> generated by the arrival of an interrupt signal on one of the CPU s external pins. They are not generated by software
> within the system but by external devices. Chapter 10 discusses interrupts and exceptions in detail.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> in response to an event is known a priori. A deterministic real-time system implies that each component of the system
> must have a deterministic behavior that contributes to the overall determinism of the system. As can be seen, a
> deterministic real-time system can be less adaptable to the changing environment. The lack of adaptability can result
> in a less robust system. The levels of determinism and of robustness must be balanced. The method of balancing

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** determinism, robustness, real-time middleware

---

> insignificant compared to most operations that a task performs. If an application s design includes frequent context
> switching, however, the application can incur unnecessary performance overhead. Therefore, design applications in a
> way that does not involve excess context switching. 
> Every time an application makes a system call, the scheduler has an opportunity to determine if it needs to switch

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, performance engineering

---

> Figure 16.6: Priority inversion example. 
> As shown in Figure 16.6, at time t1 the low-priority task (LP-task) locks the shared resource. The LP-task continues
> until time t2 when the high-priority task (HP-task) becomes eligible to run. The scheduler immediately preempts the
> LP-task and context-switches to the HP-task. The HP-task runs until time t3 when it requires the shared resource.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, priority inversion

---

> •
> Mask the current interrupt level but allow higher priority interrupts to occur. 
> •
> Perform a minimum amount of work so that a dedicated task can complete the main processing. 
> 10.5.1 Installing Exception Handlers 
> Exception service routines (ESRs) and interrupt service routines (ISRs) must be installed into the system before
> exceptions and interrupts can be handled. The installation of an ESR or ISR requires knowledge of the exception and
> interrupt table (called the general exception table).

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> development tools because the developer can select a tool based on its functional strength rather than its vendor. 
> Two common object file formats are the common object file format (COFF) and the executable and linking format
> (ELF). These file formats are incompatible with each other; therefore, be sure to select the tools, including the
> debugger, that recognize the format chosen for development.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** executable and linking format (elf)

---

> workstations, and mainframes. In some cases, GPOSes run on embedded devices that have ample memory and very
> soft real-time requirements. GPOSes typically require a lot more memory, however, and are not well suited to
> real-time embedded devices with limited memory and high performance requirements. 
> RTOSes, on the other hand, can meet these requirements. They are reliable, compact, and scalable, and they

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** real-time middleware, performance engineering

---

> assert interrupts. The edge-triggering mechanism is discussed in 'The Nature of Spurious Interrupts' on page 163,
> section 10.6. 
> The RTOS kernel scheduler cannot run when an ISR disables all system interrupts while it runs. As indicated earlier,
> interrupt processing has higher priority than task processing. Therefore, real-time tasks that have stringent deadlines
> can also be affected by a poorly designed ISR.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> If the first two tasks have real-time deadlines and the time needed to complete their associated critical sections
> impacts whether the tasks meet their deadlines, this critical section should run to completion without interruption. The
> preemption lock becomes useful in this situation. 
> Therefore, it is important to evaluate the criticality of the critical section and the overall system impact before deciding

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** critical sections, real-time middleware

---

> Locke, Douglass. 'Priority Inversion and Its Control: An experimental investigation.' IBM FSD, Ada Letters. Special
> Edition 8, no. 7 (1988): 39.
>  
> Lui, C.L. and J.W. Layland. 'Scheduling Algorithms for Multiprogramming in a Hard Real-Time Environment.' 
> Journal of Association for Computing Machinery 20, no. 1 (January 1973): 46-61.
>  
> Motorola, Inc. PowerPC?Microprocessor Family: The Programming Environments, 1994. Motorola, Inc.,
> pages 6-10, Table 6-3.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, real-time middleware

---

> precise values. The C&D system then activates additional weapons firing systems to compensate for this imprecision.
> The result is that additional guns are brought online to cover the larger firing box. The idea is that it is better to waste
> bullets than sink a destroyer.
>  
> This example shows why sometimes functional correctness might be sacrificed for timing correctness for many
> real-time systems.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing correctness, real-time middleware

---

> outstanding timers. This issue particularly occurs when each timer is implemented by being directly interfaced with the
> physical timer hardware. 
> This chapter focuses on: 
> •
> real-time clocks versus system clocks, 
> •
> programmable interval timers, 
> •
> timer interrupt service routines, 
> •
> timer-related operations, 
> •
> soft timers, and 
> •
> implementing soft-timer handling facilities. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> application's performance and responsiveness. If done correctly, the result can be a system that meets all of its
> deadlines robustly and responsively. If done incorrectly, real-time deadlines can be compromised, and the system's
> design may not be acceptable. 
> 14.3.2 Pseudo versus True Concurrent Execution 
> Concurrent tasks in a real-time application can be scheduled to run on a single processor or multiple processors.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** real-time middleware, performance engineering

---

> and another that reads that shared variable and displays its value. Using a chosen mutual exclusion algorithm to guard
> the critical section ensures that each task has exclusive access to the shared variable. These tasks do not have
> real-time requirements, and the only constraint placed on these two tasks is that the write operation precedes the
> read operation on the shared variable.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** mutual exclusion, real-time middleware

---

> Labrosse, Jean J. 2002. Embedded Systems Building Blocks , 2nd ed. Lawrence, KS: CMP Books.
>  
> Lamport, Leslie. 'The Mutual Exclusion Problem: Part I-The Theory of Interprocess Communication.' Journal of the
> Association for Computing Machinery 33, no. 2 (April 1986): 313-326.
>  
> Lamport, Leslie. 'The Mutual Exclusion Problem: Part II-Statement and Solutions.' Journal of the Association for
> Computing Machinery 33, no. 2 (April 1986).

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, mutual exclusion

---

> flight coordinates fast enough, or if the new coordinates do not steer the missile out of the collision course. 
> Therefore, we can extract two essential characteristics of real-time systems from the examples given earlier. These
> characteristics are that real-time systems must produce correct computational results, called logical or functional
> correctness, and that these computations must conclude within a predefined period, called timing correctness.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing correctness, real-time middleware

---

> inversion, can become concrete in a hurry when they bring a device to its knees. Efficiency-a small memory footprint
> and the ability to run on lower cost hardware-become key design considerations because they directly affect cost,
> power usage, size, and battery life. Of course, reliability is paramount when so much is at stake-company and
> product reputations, critical infrastructure functions, and, some times, even lives.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** nested interrupts and stack considerations

---

> single-processor system and a kernel using a priority-based preemptive scheduling algorithm. 
> 5.3.1 Ready State
>  
> When a task is first created and made ready to run, the kernel puts it into the ready state. In this state, the task
> actively competes with all other ready tasks for the processor's execution time. As Figure 5.2 shows, tasks in the
> ready state cannot move directly to the blocked state. A task first needs to run so it can make a blocking call ,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemptive priority-based scheduling, scheduling theory

---

> Priority inversion commonly happens in poorly designed real-time embedded applications. Priority inversion occurs
> when a higher priority task is blocked and is waiting for a resource being used by a lower priority task, which has
> itself been preempted by an unrelated medium-priority task. In this situation, the higher priority task s priority level
> has effectively been inverted to the lower priority task s level.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, real-time middleware

---

> of a higher priority interrupt source to preempt the processing of a lower priority interrupt. It is easy to see how
> low-priority interrupt sources are affected by higher priority interrupts and their execution times and frequency if this
> interrupt table is ordered by overall system priority. This information aids the embedded systems programmer in
> designing and implementing better ISRs that allow for nested interrupts.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, spurious interrupts

---

> As can be seen, one reason for the occurrence of spurious interrupts is unstableness of the interrupt signal. Spurious
> interrupts can be caused when the processor detects errors while processing an interrupt request. The embedded
> systems programmer must be aware of spurious interrupts and know that spurious interrupts can occur and that this
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, spurious interrupts

---

> communication mechanism. 
> Similarly, active output devices also generate interrupts when they need to communicate with applications. However,
> interrupts from active output devices are generated when they are ready to receive the next piece of data or
> notification of some event from the application. The interrupts trigger the appropriate ISR that hands off the required
> processing to an associated task using an inter-task communication mechanism.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, inter-task communication

---

> Nissanke, Nimal. 1997. Real-time Systems. Hertfordshire, England: Prentice Hall Series in Computer Science,
> ISBN 0-13-651274-7
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** real-time middleware

---

> computed results after the missed deadline have a rate of depreciation. The usefulness of the results does not reach
> zero immediately passing the deadline, as in the case of many hard real-time systems. The physical impact of a missed
> deadline is non-catastrophic. 
> A hard real-time system is a real-time system that must meet its deadlines with a near-zero degree of flexibility. The
> deadlines must be met, or catastrophes occur. The cost of such catastrophe is extremely high and can involve human

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** hard real-time systems, real-time middleware

---

> values into the IMR. The IMR only applies to maskable asynchronous exceptions and, therefore, is not saved by
> synchronous exception routines. 
> One other related difference between an ESR and an ISR is that an exception handler in many cases cannot prevent
> other exceptions from occurring, while an ISR can prevent interrupts of the same or lower priority from occurring. 
> Exception Timing 
> Discussions about the ESR or ISR, however, often mention keeping the ESR or ISR short. How so and how short

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> example, Task 3's TCB is corrupted, which is a stack overflow. Unfortunately, the corrupted TCB is not likely to be
> noticed until Task 3 is scheduled to run. These types of errors can be very hard to detect. They are a function of the
> combination of the running task and the exact frequency, timing, and sequence of interrupts or exceptions presented
> to the operating environment. This situation often gives a user or testing team the sense of a sporadic or flaky system.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** interrupts and exceptions, spurious interrupts

---

> from the real-time clock at power up or is set by the user. The programmable interval timer drives the system clock,
> i.e. the system clock increments in value per timer interrupt. Therefore, an important function performed at the timer
> interrupt is maintaining the system clock, as shown in Figure 11.2.
> Figure 11.2: System clock initialization. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> task. The section of code in the display task that reads data from the shared memory is a critical section of the
> display task. These two critical sections are called competing critical sections because they access the same shared
> resource. 
> A mutual exclusion algorithm ensures that one task's execution of a critical section is not interrupted by the competing
> critical sections of other concurrently executing tasks.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** mutual exclusion, critical sections

---

> external peripheral devices, again reducing the overall cost and size of the final product. 
> Sometimes a gray area exists when using processor type to differentiate between embedded and non-embedded
> systems. It is worth noting that, in large-scale, high-performance embedded systems, the choice between embedded
> processors and universal microprocessors is a difficult one.
>  
> In high-end embedded systems, system performance in a predefined context outweighs power consumption and cost.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, performance engineering

---

> first acquire the mutex before accessing the shared memory. The task blocks if the mutex is already locked, indicating
> that another task is accessing the shared memory. The task releases the mutex after it completes its operation on the
> shared memory. Figure 15.13 shows the order of execution with respect to each task.
> Figure 15.13: Task-to-task resource synchronization-shared memory guarded by mutex. 
> Shared Memory with Interrupt Locks

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, resource synchronization

---

> Figure 12.1: I/O subsystem and the layered model. Figure 12.2: Port-mapped I/O. Figure 12.3: Memory-mapped
> I/O. Figure 12.4: DMA I/O. Figure 12.5: Servicing a write operation for a block-mode device. Figure 12.6: I/O
> function mapping. Figure 12.7: Uniform I/O driver table. Figure 12.8: Associating devices with drivers. 
> Chapter 13:
>  Memory Management
>  
> Figure 13.1: States of a memory allocation map. Figure 13.2: Memory allocation map with possible fragmentation.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** port-mapped i/o, memory-mapped i/o

---

> port mapped or memory mapped. This information determines which of two methods, port-mapped I/O or
> memory-mapped I/O, is deployed to access an I/O device. 
> When the I/O device address space is separate from the system memory address space, special processor
> instructions, such as the IN and OUT instructions offered by the Intel processor, are used to transfer data between
> the I/O device and a microprocessor register or memory.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** port-mapped i/o, memory-mapped i/o

---

> fragmentation per allocation. In addition, the number of blocks to allocate for each size is also impossible to predict.
> In many cases, the memory pools are constructed based on a number of assumptions. The result is that some
> memory pools are under used or not used at all, while others are overused. 
> On the other hand, this memory allocation method can actually reduce internal fragmentation and provide high

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> problem becomes a resource-scheduling problem. The scheduling algorithms of a real-time system must schedule
> system resources so that jobs created in response to both periodic and aperiodic events can obtain the resources at
> the appropriate time. This process affords each job the ability to meet its specific timing constraints. This topic is
> addressed in detail in Chapter 14.
>  
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** scheduling theory, real-time middleware

---

> Services-are operations that the kernel performs on an object or, generally operations such as timing,
> interrupt handling, and resource management.
>  
> Figure 4.2 illustrates these components, each of which is described next.
>  
> Figure 4.2: Common components in an RTOS kernel that including objects, the scheduler, and some services. 
> This diagram is highly simplified; remember that not all RTOS kernels conform to this exact set of objects, scheduling
> algorithms, and services.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, scheduling theory

---

> monitor 20, 32-33, 36, 38-39, 44, 46, 51 
> monolithic 54, 133 
> MS-DOS 135 
> multitasking 5, 54, 57-58, 65, 211, 217 
> mutex 80, 82-87, 91-94, 126-129, 209-211, 233, 235-236, 245-246, 254 
> mutual exclusion 232-233, 240-241, 260 
> mutually exclusive access 79, 86, 90 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** multitasking, mutual exclusion

---

> High-level programming languages, such as C and C++, typically use the stack space as the primary vehicle to pass
> variables between functions and objects of the language. 
> Figure 10.4: Task TCB and stack. 
> The active stack pointer (SP) is reinitialized to that of the active task each time a task context switch occurs. The
> underlying real-time kernel performs this work. As mentioned earlier, the processor uses whichever stack the SP

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, real-time middleware

---

> sys_timer_enable Enables the system timer chip interrupts. As soon as this operation is
> invoked, the timer interrupts occur at the preprogrammed frequency,
> assuming that the timer chip has been properly initialized with the desired
> values. Only after this operation is complete can kernel task scheduling
> take place. 
> sys_timer_disable Disables the system timer chip interrupts. After this operation is complete,
> the kernel scheduler is no longer in effect. Other system-offered services

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, scheduling theory

---

> 15.5 Critical Section Revisited 
> Many sources give the impression that a mutual exclusion algorithm similar to either the interrupt lock or the
> preemption lock should be used to guard a critical section. One implication is that the critical section should be kept
> short. This idea bears further examination. 
> The critical section of a task is a section of code that accesses a shared resource. A competing critical section is a

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** mutual exclusion, spurious interrupts

---

> opportunities created by the Internet, embedded systems will continue to reshape the world for years to come.
>  
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems

---

> Figure 12.1 illustrates the I/O subsystem in relation to the rest of the system in a layered software model. As shown,
> each descending layer adds additional detailed information to the architecture needed to manage a given device. 
> Figure 12.1: I/O subsystem and the layered model. 
> 12.2.1 Port-Mapped vs. Memory-Mapped I/O and DMA 
> The bottom layer contains the I/O device hardware. The I/O device hardware can range from low-bit rate serial lines

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** port-mapped i/o, memory-mapped i/o

---

> Table 10.1: Interrupt table. Table 10.2: Exception priorities. 
> Chapter 11:
>  Timer and Timer Services
>  
> Table 11.1: Group 1 Operations. Table 11.2: Group 2 Operations. Table 11.3: Group 3 Operations. 
> Chapter 12:
>  I/O Subsystem
>  
> Table 12.1: I/O functions. 
> Chapter 14:
>  Modularizing An Application For
> Concurrency
>  
> Table 14.1: Common tasks that interface with active I/O devices. Table 14.2: Common tasks that interface with
> passive I/O devices. Table 14.3: Properties of tasks. 
> Chapter 16:

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, concurrency theory

---

> •
> Calling a registered kernel function to notify the passage of a preprogrammed period-For the
> following discussion, the registered kernel function is called announce_time_tick. 
> •
> Acknowledging the interrupt, reinitializing the necessary timer control register(s), and returning
> from interrupt. 
> The announce_time_tick function is invoked in the context of the ISR; therefore, all of the restrictions placed on an

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timer isr and announce_time_tick

---

> Real-time systems are defined as those systems in which the overall correctness of the system depends on both the
> functional correctness and the timing correctness. The timing cor-rectness is at least as important as the functional
> correctness. 
> It is important to note that we said the timing correctness is at least as important as the functional correctness. In
> some real-time systems, functional correctness is sometimes sacrificed for timing correctness. We address this point

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timing correctness, real-time middleware

---

> exceptions. Much like a context switch for tasks when a higher priority one becomes ready, the lower priority
> exception is preempted, which allows the higher priority ESR to execute. When the higher priority service routine is
> complete, the earlier running service routine returns to execution. Figure 10.6 illustrates this process.
> Figure 10.6: Interrupt nesting. 
> The task block in the diagram in this example shows a group of tasks executing. A low-priority interrupt then

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, spurious interrupts

---

> the other higher priority task to complete with limited impact. Figure 10.10 illustrates this concept.
> Figure 10.10: Interrupt processing in two contexts. 
> The benefits to this concept are the following: 
> •
> Lower priority interrupts can be handled with less priority than more critical tasks running in the system. 
> •
> This approach reduces the chance of missing interrupts. 
> •
> This approach affords more concurrency because devices are being serviced minimally so that they can

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, concurrency theory

---

> 5.3 Task States and Scheduling 
> Whether it's a system task or an application task, at any time each task exists in one of a small number of states,
> including ready, running, or blocked. As the real-time embedded system runs, each task moves from one state to
> another, according to the logic of a simple finite state machine (FSM). Figure 5.2 illustrates a typical FSM for task
> execution states, with brief descriptions of state transitions.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** scheduling theory, real-time middleware

---

> •
> the starting address of the physical memory block used for dynamic memory allocation, 
> •
> the overall size of this physical memory block, and 
> •
> the allocation table that indicates which memory areas are in use, which memory areas are free, and the size
> of each free region. 
> This chapter examines aspects of memory management through an example implementation of the malloc and free
> functions for an embedded system. 
> 13.2.1 Memory Fragmentation and Compaction

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> the table, not within the blocks themselves. One way to eliminate this type of fragmentation is to compact the area
> adjacent to these two blocks. The range of memory content from address 0x100A0 (immediately following the first
> free block) to address 0x101BF (immediately preceding the second free block is shifted 32 bytes lower in memory,
> to the new range of 0x10080 to 0x1019F, which effectively combines the two free blocks into one 64-byte block.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> 3.4 Target System Software Initialization Sequence
>  
> The target image referred to repeatedly in the last section is a combination of sophisticated software components and
> modules as shown in Figure 3.6. The software components include the following: the board support package (BSP),
> which contains a full spectrum of drivers for the system hardware components and devices; the RTOS, which

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** board support package (bsp)

---

> kernel s implementation, the message might be copied just once in this case from the sending task s memory area to
> the receiving task s memory area, bypassing the copy to the message queue s memory area. 
> Because copying data can be expensive in terms of performance and memory requirements, keep copying to a
> minimum in a real-time embedded system by keeping messages small or, if that is not feasible, by using a pointer
> instead.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** real-time middleware, performance engineering

---

> characteristics of the interrupt source. Table 10.1 is an example of an interrupt table for the hypothetical example
> shown in Figure 10.1. The information in the table illustrates all of the sources of external interrupts that the
> embedded system must handle. 
> Why is it important to know this information? Understanding the priorities of the interrupt sources enables the
> embedded systems programmer to better understand the concept of nested interrupts. The term refers to the ability

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, spurious interrupts

---

> when the processor is currently processing a higher priority interrupt. The pending interrupt is acknowledged and
> processed after all higher priority interrupts that were pending have been processed. An active interrupt is the one
> that the processor is acknowledging and processing. Being aware of the existence of a pending interrupt and raising
> this interrupt to the processor at the appropriate time is accomplished through hardware and is outside the concern of
> an embedded systems developer.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, spurious interrupts

---

> One block is at address 0x10080, and the other at address 0x101C0, which cannot be used for any memory
> allocation requests larger than 32 bytes. Because these isolated blocks do not contribute to the contiguous free space
> needed for a large allocation request, their existence makes it more likely that a large request will fail or take too long.
> The existence of these two trapped blocks is considered external fragmentation because the fragmentation exists in

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> Preemption lock Locks out higher priority tasks from preempting the current task
>  
> Preemption unlock Unlocks a preemption lock 
> Using manual scheduling, developers can suspend and resume tasks from within an application. Doing so might be
> important for debugging purposes or, as discussed earlier, for suspending a high-priority task so that lower priority
> tasks can execute.
>  
> A developer might want to delay (block) a task, for example, to allow manual scheduling or to wait for an external

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** preemption locks, scheduling theory

---

> Index
>  
> M 
> mailbox 107 
> makefile 20 
> Mask Programmed ROM 9 
> maskable exception 149 
> mass storage device 134, 139 
> MEMORY 28-29 
> memory 199-212 
> alignment 31 
> compaction 199, 201-202 
> fragmentation 199-202 
> leak 73-74 
> map 28-29, 40-41, 50 
> mapped I/O 189 
> memory management unit
> See MMU 211 
> message
> length 98, 100 
> queue 56-57, 61, 72, 77, 97, 105, 110, 112, 115-116, 138, 234, 237-238, 244, 247-249, 251-252, 254-255,
> 262 
> sink 105 
> source 105 
> micro-kernel 133, 141 
> MMU 5, 211

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> Because the resource is in the locked state, the HP-task must block and wait for its release. At this point, the
> scheduler context-switches back to the LP-task. Priority inversion begins at time t3. At time t4, the LP-task releases
> the shared resource, which triggers preemption and allows the HP-task to resume execution. Priority inversion ends
> at time t4. The HP-task completes at time t5, which allows the LP-task to resume execution and finally complete at
> time t6.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, priority inversion

---

> ISR are applicable to announce_time_tick. In reality, announce_time_tick is part of the timer ISR. The
> announce_time_tick function is called to notify the kernel scheduler about the occurrence of a timer tick. Equally
> important is the announcement of the timer tick to the soft-timer handling facility. These concepts are illustrated in 
> Figure 11.3. 
> Figure 11.3: Steps in servicing the timer interrupt.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** timer isr and announce_time_tick

---

> should it be? To answer this question, let's focus the discussion on the external interrupts and the ISR. 
> It is the hardware designer's job to use the proper interrupt priority at the PIC level, but it is the ISR programmer's
> responsibility to know the timing requirements of each device when an ISR runs with either the same level or all
> interrupts disabled. 
> The embedded systems programmer, when designing and implementing an ISR, should be aware of the interrupt

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, spurious interrupts

---

> Guideline 1a: Identify Active Devices 
> Active input or output I/O devices use interrupts to communicate with real-time applications. Every time an active
> input device needs to send data or notification of an event to a real-time application, the device generates an
> interrupt. The interrupt triggers an ISR that executes the minimum code needed to handle the input. If a lot of
> processing is required, the ISR usually hands off the process to an associated task through an inter-task

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> The maximum frequency column of the interrupt table specifies the process time constraint placed on all ISRs that
> have the smallest impact on the overall system. 
> Table 10.1: Interrupt table. 
> Source Priority Vector Address IRQ Max Freq. Description 
> Airbag Sensor Highest 14h 8 N/A Deploys airbag
>  
> Break Sensor High 18h 7 N/A Deploys the breaking system
>  
> Fuel Level Sensor Med 1Bh 6 20Hz Detects the level of gasoline
>  
> Real-Time Clock Low 1Dh 5 100Hz Clock runs at 10ms ticks

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> The diagram for both an active I/O device acting as an input or an output to an application and for a device
> generating interrupts in a synchronous or asynchronous manner is similar to the one illustrated in Figure 14.5.
> Figure 14.5: General communication mechanisms for active I/O devices. 
> Some typical tasks that can result from identifying an active I/O device in a real-time application are listed in Table
> 14.1. 
> Table 14.1: Common tasks that interface with active I/O devices.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, real-time middleware

---

> + offset' format. This format indicates that the addresses in the map are relative, i.e., the offset must be added to the
> start address of the I/O space for port-mapped I/O or the offset must be added to the base address of the system
> memory space for memory-mapped I/O in order to access a particular register on the device. 
> The processor has to do some work in both of these I/O methods. Data transfer between the device and the system

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** port-mapped i/o, memory-mapped i/o

---

> 11.5.2 Implementation Considerations 
> A soft-timer facility should allow for efficient timer insertion, timer deletion and cancellation, and timer update. These
> requirements, however, can conflict with each other in practice. For example, imagine the linked list-timer
> implementation shown in Figure 11.8. The fastest way to start a timer is to insert it either at the head of the timer list
> or at the tail of the timer list if the timer entry data structure contains a double-linked list.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** nested interrupts and stack considerations

---

> resides in the system ROM, the on-board flash memory, or other types of non-volatile memory devices. We will
> revisit the loader program from the system-bootstrapping perspective. In the discussions to follow, the loader refers
> to the code that performs system bootstrapping, image downloading, and initialization.
>  
> The concepts are best explained through an example. In this example, assume an embedded loader has been

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** bootstrapping and system initialization

---

> 11.3 Programmable Interval Timers 
> The programmable interval timer (PIT), also known as the timer chip , is a device designed mainly to function as
> an event counter, elapsed time indicator, rate-controllable periodic event generator, as well as other applications for
> solving system-timing control problems. 
> The functionality of the PIT is commonly incorporated into the embedded processor, where it is called an on-chip

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** programmable interval timer (pit)

---

> The environment of the real-time system creates the external events. These events are received by one or more
> components of the real-time system. The response of the real-time system is then injected into its environment
> through one or more of its components. Decomposition of the real-time system, as shown in Figure 1.5, leads to the
> general structure of real-time systems.
>  
> The structure of a real-time system, as shown in Figure 1.7, is a controlling system and at least one controlled system.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** outside-in decomposition, real-time middleware

---

> 16.3 Deadlocks 
> Deadlock is the situation in which multiple concurrent threads of execution in a system are blocked permanently
> because of resource requirements that can never be satisfied. 
> A typical real-time system has multiple types of resources and multiple concurrent threads of execution contending for
> these resources. Each thread of execution can acquire multiple resources of various types throughout its lifetime.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** deadlock, real-time middleware

---

> systems. 
> Some core functional similarities between a typical RTOS and GPOS include: 
> •
> some level of multitasking, 
> •
> software and hardware resource management, 
> •
> provision of underlying OS services to applications, and 
> •
> abstracting the hardware from the software application. 
> On the other hand, some key functional differences that set RTOSes apart from GPOSes include: 
> •
> better reliability in embedded application contexts,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, multitasking

---

> continue operations while their previous requests are accumulated without loss to the extent allowed by the
> system. 
> On the other hand, the interrupt response time increases, because now the interrupt response time is TD = TB + TC
> + TE + TF. The increase in response time is attributed to the scheduling delay, and the daemon task might have to
> yield to higher priority tasks. 
> The scheduling delay happens when other higher priority tasks are either running or are scheduled to run. The

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts, scheduling theory

---

> Index
>  
> R 
> raise 84, 144-145, 151, 154, 160-161, 164, 276-278 
> RAM 9, 42 
> random access memory
> See RAM 
> Rate Monotonic Analysis
> See RMA 
> rate monotonic scheduling
> See RMS 
> read only memory
> see ROM 
> ready state 67-73, 80 
> real 13 
> real-time clock 147-148, 168-169, 182, 184 
> real-time embedded system 1, 3, 10, 54-56, 61, 67, 101, 208-209, 214, 217 
> real-time operating system
> See RTOS 
> real-time system 10-13, 63, 65, 71, 97, 125, 213-214, 219, 225-227, 229, 260 
> hard 14, 16 
> hard vs. soft 14

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** scheduling theory, real-time middleware

---

> scheduler that determines which task executes next. It is the dispatcher that does the actual work of context switching
> and passing execution control. 
> Depending on how the kernel is first entered, dispatching can happen differently. When a task makes system calls,
> the dispatcher is used to exit the kernel after every system call completes. In this case, the dispatcher is used on a

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, dispatcher

---

> helpful during a priority inversion , in which a lower priority task has a shared resource that a higher priority task
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion

---

> type of interrupt must be handled as any other type of interrupts. The default action from the kernel is usually
> sufficient. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts

---

> fixed-size blocks. The size of this larger memory block is at least as large as the requested size; it is the closest to the
> multiple of the unit size. For example, if the allocation requests 100 bytes, the returned block has a size of 128 bytes
> (4 units x 32 bytes/unit). As a result, the requestor does not use 28 bytes of the allocated memory, which is called
> memory fragmentation. This specific form of fragmentation is called internal fragmentation because it is internal to the

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** internal fragmentation, external fragmentation

---

> Chapter 16: Common Design
> Problems
>  
> 16.1 Introduction 
> Most embedded RTOSes facilitate a multitasking- or multithreading-capable environment. Many challenging design
> problems arise when developing embedded applications in multitasking systems. 
> The nature of this environment is that multiple threads of execution share and contend for the same set of resources.
> As such, resource sharing requires careful coordination to ensure that each task can eventually acquire the needed

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, multitasking

---

> resource type. This estimation is often difficult to predict in a dynamic system. For more static embedded systems or
> for systems with predictable operating environments, however, deadlock avoidance can be achieved. The estimations
> from all tasks are used to construct the demand table, D. This resource estimation only identifies the potential
> maximum resource requirement through certain execution paths. In the majority of cases, there would be

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** embedded systems, deadlock

---

> the interrupt lock unless nested interrupts are supported (i.e., interrupts are enabled while an ISR executes) and
> multiple ISRs can access the data. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** spurious interrupts

---

> contexts. When the scheduler determines a context switch is necessary, it relies on an associated module, called the
> dispatcher, to make that switch happen. 
> 4.4.4 The Dispatcher 
> The dispatcher is the part of the scheduler that performs context switching and changes the flow of execution. At any
> time an RTOS is running, the flow of execution, also known as flow of control, is passing through one of three areas:

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, dispatcher

---

> call-by-call basis so that it can coordinate task-state transitions that any of the system calls might have caused. (One
> or more tasks may have become ready to run, for example.) 
> On the other hand, if an ISR makes system calls, the dispatcher is bypassed until the ISR fully completes its
> execution. This process is true even if some resources have been freed that would normally trigger a context switch

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** context switch, dispatcher

---

> 2.5 Points to Remember
>  
> Some points to remember include the following:
>  
> •
> The linker performs symbol resolution and symbol relocation.
>  
> •
> An embedded programmer must understand the exact memory layout of the target system towards which
> development is aimed.
>  
> •
> An executable target image is comprised of multiple program sections.
>  
> •
> The programmer can describe the physical memory, such as its size and its mapping address, to the linker

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** symbol resolution and relocation

---

> always take resources from lower priority tasks, this sharing scheme is not fair and can prevent lower priority tasks
> from ever completing. This condition is called starvation. Maximization of resource utilization is yet another
> conflicting requirement. 
> Two of the most common design problems facing embedded developers are the deadlock and the priority inversion
> problem. 
> Specifically, this chapter focuses on: 
> •
> resource classification, 
> •
> resource request models, 
> •
> definition of deadlocks,

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** priority inversion, deadlock

---

> So, how exactly does a scheduler handle multiple schedulable entities that need to run simultaneously? The answer is
> by multitasking. The multitasking discussions are carried out in the context of uniprocessor environments. 
> 4.4.2 Multitasking 
> Multitasking is the ability of the operating system to handle multiple activities within set deadlines. A real-time kernel
> might have multiple tasks that it has to schedule to run. One such multitasking scenario is illustrated in Figure 4.3.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** multitasking, real-time middleware

---

> complete, depending on the average number of tasks existing in the system at a given time and depending on
> the overall system scheduling behavior. 
> •
> Eliminating the circular-wait deadlock condition. An ordering on the resources must be imposed so that
> if a task currently holds resource Ri, a subsequent request must be for resource Rj where j > i. The next
> request must be for resource Rk where k > j, and so on.

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** deadlock, scheduling theory

---

> Index
>  
> I 
> I/O 42, 47, 62, 86, 90, 138, 183-192, 215, 217-218, 225, 227, 233, 236, 238, 240, 251, 260 
> active device 219-222 
> isolated 189 
> passive device 219, 223-224 
> port 189-190 
> subsystem 187-198 
> uniform 192, 195-197 
> idle task 67, 69 
> IEEE 1149.1 52 
> imprecise exception 149 
> IN 189 
> in-circuit emulator 51 
> indeterminism 239-240 
> industrial automation 2 
> input and output
> See I/O 
> instruction pointer
> See IP 
> interleaving 57, 206, 217 
> interlocked 105, 107 
> internal error 145-146

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** determinism, idle task

---

> deadline, and it is a hard real-time system. It is the penalty that makes this determination.
>  
> •
> What defines the deadline for a hard real-time system?
>  
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** real-time middleware

---

> For cases in which multiple equivalent shared resources are used, a counting semaphore comes in handy, as shown in 
> Figure 6.10. 
> Figure 6.10: Single shared-resource-access synchronization. 
> This document is created with the unregistered version of CHM2PDF Pilot

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** resource synchronization

---

> involves transferring data between the device and the processor register and then from the processor register to
> memory. The transfer speed might not meet the needs of high-speed I/O devices because of the additional data copy
> involved. Direct memory access (DMA) chips or controllers solve this problem by allowing the device to access the
> memory directly without involving the processor, as shown in Figure 12.4. The processor is used to set up the DMA

**Categories:** embedded systems engineering, real-time systems, operating systems, computer architecture, software engineering, concurrent and parallel systems, software architecture
**Concepts:** direct memory access (dma)

---

### Understanding Distributed Systems  What every developer -- Roberto Vitillo -- Version 1 1 1, Erscheinungsort nicht ermittelbar, 2021 -- Roberto -- 9781838430207 -- 30056efa5b79dbb60bc3e526693a5c8d -- Anna’s Archive

*File: Understanding Distributed Systems_ What every developer -- Roberto Vitillo -- Version 1_1_1, Erscheinungsort nicht ermittelbar, 2021 -- Roberto -- 9781838430207 -- 30056efa5b79dbb60bc3e526693a5c8d -- Anna’s Archive.pdf*

> 1.6  Anatomy of a distributed system. . . . . . . . . .17
> I Communication20
> 2 Reliable links23
> 2.1  Reliability. . . . . . . . . . . . . . . . . . . . . . .23
> 2.2  Connection lifecycle. . . . . . . . . . . . . . . . .24
> 2.3  Flow control. . . . . . . . . . . . . . . . . . . . . .25
> 2.4  Congestion control. . . . . . . . . . . . . . . . . .27
> 2.5  Custom protocols. . . . . . . . . . . . . . . . . . .28
> 3 Secure links30
> 3.1  Encryption. . . . . . . . . . . . . . . . . . . . . . .30

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication, anatomy of a distributed system, reliable links, connection lifecycle, flow control, congestion control, congestion window

---

> CHAPTER 10. REPLICATION75
> 10.2 Consensus
> State machine replication can be used for much more than just
> replicating data since it’s a solution to the consensus problem.Con-
> sensus
> 2
> is a fundamental problem studied in distributed systems
> research, which requires a set of processes to agree on a value in a
> fault-tolerant way so that:
> •every non-faulty process eventually agrees on a value;
> •the final decision of every non-faulty process is the same ev-
> erywhere;

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, state machine replication, replication, leaderless replication, consensus, data replication strategies, fault-tolerant design

---

> Typically, when you have a problem that requires consensus, the
> last thing you want to do is to solve it from scratch by implement-
> ing an algorithm like Raft. While it’s important to understand
> what consensus is and how it can be solved, many good open-
> source projects implement state machine replication and expose
> simple APIs on top of it, like etcd and ZooKeeper.
> 10.3 Consistency models
> Let’s take a closer look at what happens when a client sends a re-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, state machine replication, replication, leaderless replication, consensus, consistency models, data replication strategies

---

> CHAPTER 11. TRANSACTIONS94
> We have already encountered the log abstraction in chapter10
> when discussing state machine replication. If you squint a little,
> you will see that what we have just implemented here is a form
> of state machine replication, where the state is represented by all
> products in the catalog, and the replication happens across the
> relational database and the search index.
> Message logs are part of a more general communication interac-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, state machine replication, replication, leaderless replication, transactions, database systems, data replication strategies

---

> data, which requires coordination to keep it in sync.
> Replication and sharding are techniques that are often combined,
> but are orthogonal to each other. For example, a distributed data
> store can divide its data into N partitions and distribute them over
> K nodes. Then, a state-machine replication algorithm like Raft can
> be used to replicate each partition R times (see Figure
> 14.5).
> We have already discussed one way of replicating data in chap-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, coordination, state machine replication, replication, leaderless replication, range partitioning, data replication strategies

---

> CHAPTER 14. DUPLICATION152
> 14.3 Caching
> Let’s take a look now at a very specific type of replication that only
> offers best effort guarantees: caching.
> Suppose a service requires retrieving data from a remote depen-
> dency, like a data store, to handle its requests. As the service scales
> out, the dependency needs to do the same to keep up with the
> ever-increasing load. A cache can be introduced to reduce the load
> on the dependency and improve the performance of accessing the
> data.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, state machine replication, replication, leaderless replication, data replication strategies, service mesh, performance engineering

---

> 53
> who can perform operations that others can’t, like accessing a
> shared resource or coordinating other processes’ actions.
> Chapter10introduces one of the fundamental challenges in dis-
> tributed systems, namely keeping replicated data in sync across
> multiple nodes. This chapter explores why there is a tradeoff
> between consistency and availability and describes how the Raft
> replication algorithm works.
> Chapter
> 11dives into how to implement transactions that span

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, state machine replication, replication, leaderless replication, transactions, data replication strategies

---

> Chapter 10
> Replication
> Data replication is a fundamental building block of distributed sys-
> tems. One reason to replicate data is to increase availability. If
> some data is stored exclusively on a single node, and that node
> goes down, the data won’t be accessible anymore. But if the data
> is replicated instead, clients can seamlessly switch to a replica. An-
> other reason for replication is to increase scalability and perfor-
> mance; the more replicas there are, the more clients can access the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, scalability, state machine replication, replication, leaderless replication, data replication strategies

---

> CHAPTER 10. REPLICATION72
> followers and call it a day, as any process can fail at any time, and
> the network can lose messages. This is why a large part of the al-
> gorithm is dedicated to fault-tolerance.
> 10.1 State machine replication
> When the system starts up, a leader is elected using Raft’s leader
> election algorithm, which we discussed in chapter9. The leader is
> the only process that can make changes to the replicated state. It

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, raft leader election, leader election state machine, data replication strategies

---

> erywhere;
> •and the value that has been agreed on has been proposed by
> a process.
> Consensus has a large number of practical applications. For ex-
> ample, a set of processes agreeing which one should hold a lock
> or commit a transaction are consensus problems in disguise. As
> it turns out, deciding on a value can be solved with state machine
> replication. Hence, any problem that requires consensus can be
> solved with state machine replication too.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, consensus, transactions, data replication strategies

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION117
> 12.3 CQRS
> The API’s gateway ability to compose internal APIs is quite lim-
> ited, and querying data distributed across services can be very in-
> efficient if the composition requires large in-memory joins.
> Accessing data can also be inefficient for reasons that have nothing
> to do with using a microservice architecture:
> •The data store used might not be well suited for specific
> types of queries. For example, a vanilla relational data store

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, scalability, microservices, functional decomposition, apis, api gateway

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION119
> the ability to communicate with the latter even if it’s temporarily
> unavailable. Messaging provides several other benefits:
> •It allows a client to execute an operation on a service asyn-
> chronously. This is particularly convenient for operations
> that can take a long time to execute. For example, suppose
> a video needs to be converted to multiple formats optimized
> for different devices. In that case, the client could write a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, operations, microservices, functional decomposition, messaging, service mesh

---

> cost of increasing the system’s complexity.
> One of the benefits of using a dynamic service discovery mecha-
> nism is that servers can be added and removed from the LB’s pool
> at any time. This is a crucial functionality that cloud providers
> leverage to implement autoscaling
> 2
> , i.e., the ability to automati-
> cally spin up and tear down servers based on their load.
> Health checks
> Health checks are used by the LB to detect when a server can no

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, microservices, discovery, service discovery, capacity planning and autoscaling, service mesh

---

> ter10. This section will take a broader, but less detailed, look at
> replication and explore different approaches with varying trade-
> offs. To keep things simple, we will assume that the dataset is
> small enough to fit on a single node, and therefore no partitioning
> is needed.
> 14.2.1 Single leader replication
> The most common approach to replicate data is the single leader,
> multiple followers/replicas approach (see Figure14.6). In this ap-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, range partitioning, hash partitioning, data replication strategies

---

> extremes that provide some advantages at the expense of others.
> Most data stores have replication strategies that use a combination
> of the two. For example, in Raft, the leader replicates its writes to
> a majority before returning a response to the client. And in Post-
> greSQL, you can configure a subset of replicas to receive updates
> synchronously
> 11
> rather than asynchronously.
> 14.2.2 Multi-leader replication
> In multi-leader replication, there is more than one node that can

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, multi-leader replication, leaderless replication, retry strategies, data replication strategies

---

> ple, a workload with many reads benefits from a smaller R, but in
> turn, that makes writes slower and less available.
> Like in multi-leader replication, a conflict resolution strategy
> needs to be used when two or more writes to the same record
> happen concurrently.
> Leaderless replication is even more complex than multi-leader
> replication, as it’s offloading the leader responsibilities to the
> 12
> https://josephg.com/blog/crdts-are-the-future/

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** name resolution, state machine replication, replication, multi-leader replication, leaderless replication, data replication strategies

---

> would like to!), this book is for you. When building distributed
> systems, you need to be familiar with the network stack, data
> consistency models, scalability and reliability patterns, and much
> more.  Although you can build applications without knowing
> any of that, you will end up spending hours debugging and
> re-designing their architecture, learning lessons that you could
> have acquired in a much faster and less painful way. Even if you

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, scalability, system architecture, tcp reliability, consistency models

---

> parts and relationships, or in other words, its architecture. The
> architecture differs depending on the angle you look at it.
> Physically, a distributed system is an ensemble of physical ma-
> chines that communicate over network links.
> At run-time, a distributed system is composed of software pro-
> cesses that communicate viainter-process communication(IPC)
> mechanisms like HTTP, and are hosted on machines.
> From an implementation perspective, a distributed system is a set

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication, system architecture, inter-process communication (IPC), serverless architectures

---

> Chapter 2
> Reliable links
> TCP
> 1
> is a transport-layer protocol that exposes a reliable communi-
> cation channel between two processes on top of IP.TCP guarantees
> that a stream of bytes arrives in order, without any gaps, duplica-
> tion or corruption. TCP also implements a set of stability patterns
> to avoid overwhelming the network or the receiver.
> 2.1 Reliability
> To create the illusion of a reliable channel, TCP partitions a byte
> stream into discrete packets called segments. The segments are

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, link layer, transport layer, reliable links, tcp reliability

---

> Chapter 3
> Secure links
> We now know how to reliably send bytes from one process to an-
> other over the network. The problem is these bytes are sent in the
> clear, and any middle-man can intercept our communication. To
> protect against that, we can use theTransport Layer Security
> 1
> (TLS)
> protocol. TLS runs on top of TCP and encrypts the communica-
> tion channel so that application layer protocols, like HTTP, can
> leverage it to communicate securely. In a nutshell, TLS provides

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, link layer, transport layer, application layer, transport layer security (tls)

---

> project, is one of the most popular IDL for RESTful APIs based
> on HTTP. With it, we can formally describe our API in a YAML
> document, including the available endpoints, supported request
> methods and response status codes for each endpoint, and the
> schema of the resources’ JSON representation.
> For example, this is how part of the/productsendpoint of the cata-
> log service’s API could be defined:
> openapi:3.0.0
> info:
> version:"1.0.0"
> title:Catalog Service API
> paths:
> /products:
> get:

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, restful http, http methods and status codes, service mesh

---

> Even though these models are just abstractions of real communi-
> cation links, they are useful to verify the correctness of algorithms.
> As we have seen in the previous chapters, it’s possible to build a
> reliable and authenticated communication link on top of a fair-loss

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, reliable links, fair-loss link model, reliable link model, authenticated reliable link

---

> data concurrently without hitting performance degradations.
> Unfortunately replicating data is not simple, as it’s challenging
> to keep replicas consistent with one another. In this chapter, we
> will explore Raft’s replication algorithm
> 1
> , which is one of the algo-
> rithms that provide the strongest consistency guarantee possible
> — the guarantee that to the clients, the data appears to be located
> on a single node, even if it’s actually replicated.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies, performance engineering

---

> does so by storing the sequence of operations that alter the state
> into a local ordered log, which it then replicates to the followers;
> it’s the replication of the log that allows the state to be replicated
> across processes.
> As shown in Figure
> 10.1, a log is an ordered list of entries where
> each entry includes:
> •the operation to be applied to the state, like the assignment
> of 3 to x;
> •the index of the entry’s position in the log;
> •and the term number (the number in each box).

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, state machine replication, replication, leaderless replication, data replication strategies

---

> other end. Thanks to channels, communication between two par-
> ties is possible even if the destination is temporarily not available.
> Messaging provides several other benefits, which we will explore
> in this section, along with best practices and pitfalls you can run
> into.
> Partitioning
> When a dataset no longer fits on a single node, it needs to be par-
> titioned across multiple nodes. Partitioning is a general technique
> that can be used in a variety of circumstances, like sharding TCP

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, messaging, partitioning and sharding, range partitioning, hash partitioning

---

> connections across backends in a load balancer.
> Wewillexploredifferentshardingstrategiesinsection
> 13.1, suchas
> range and hash partitioning. Then, in section
> 13.2, we will discuss
> how to rebalance partitions either statically or dynamically.
> Duplication
> The easiest way to add more capacity to a service is to create more
> instances of it and have some way of routing, or balancing, re-
> quests to them. This can be a fast and cheap way to scale out a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, partitioning and sharding, range partitioning, hash partitioning, service mesh

---

> Chapter 12
> Functional
> decomposition
> 12.1 Microservices
> An application typically starts its life as a monolith. Take a modern
> backend of a single-page JavaScript application (SPA), for exam-
> ple. It might start out as a single stateless web service that exposes
> a RESTful HTTP API and uses a relational database as a backing
> store. The service is likely to be composed of a number of compo-
> nents or libraries that implement different business capabilities, as
> shown in Figure
> 12.1.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, restful http, database systems, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION111
> Figure 12.3:The API gateway hides the internal APIs from its
> clients.
> 12.2.2 Composition
> While data of a monolithic application typically resides in a sin-
> gle data store, in a distributed system, it’s spread across multiple
> services. As such, some use cases might require stitching data
> back together from multiple sources. The API gateway can offer a
> higher-level API that queries multiple services and composes their

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, microservices, functional decomposition, apis, api gateway

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION112
> not have propagated to all services yet; in that case, the gateway
> will have to somehow resolve this discrepancy.
> 12.2.3 Translation
> The API gateway can translate from one IPC mechanism to an-
> other. For example, it can translate a RESTful HTTP request into
> an internal gRPC call.
> The gateway can also expose different APIs to different types of
> clients. For example, a web API for a desktop application can po-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, apis, restful http, api gateway

---

> tains the principal’s ID and the roles granted to it, which are used
> by the application’s API handlers to decide whether to allow the
> principal to perform an operation or not.
> Translating this approach to a microservice architecture is not
> that straightforward. For example, it’s not obvious which service
> should be responsible for authenticating and authorizing requests,
> as the handling of requests can span multiple services.
> One approach is to have the API gateway be responsible for au-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, microservices, api gateway, serverless architectures, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION118
> Figure12.5:Inthisexample, thereadandwritepathsareseparated
> out into different services.
> 12.4 Messaging
> When an application is decomposed into services, the number of
> network calls increases, and with it, the probability that a request’s
> destination is momentarily unavailable. So far, we have mostly as-
> sumed services communicate using a direct request-response com-
> munication style, which requires the destination to be available

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, microservices, functional decomposition, request-response style, messaging

---

> CHAPTER 14. DUPLICATION145
> 14.2 Replication
> If the servers behind a load balancer are stateless, scaling out is as
> simple as adding more servers. But when there is state involved,
> some form of coordination is required.
> Replication is the process of storing a copy of the same data in
> multiple nodes. If the data is static, replication is easy: just copy
> the data to multiple nodes, add a load balancer in front of it, and
> you are done. The challenge is dealing with dynamically changing

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** coordination, state machine replication, replication, leaderless replication, data replication strategies

---

> CHAPTER 14. DUPLICATION146
> Figure 14.5:A replicated and partitioned data store. A node can
> be the replication leader for a partition while being a follower for
> another one.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, range partitioning, data replication strategies

---

> which is one of the worst possible trade-offs you can make.
> The other issue is consistency. A successful write might not be vis-
> ible by some or all replicas because the replication happens asyn-
> chronously. The client could send a write to the leader and later
> fail to read the data from a replica because it doesn’t exist there yet.
> The only guarantee is that if the writes stop, eventually, all replicas
> will catch up and be identical (eventual consistency).
> Synchronous replication

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, eventual consistency, data replication strategies

---

> CHAPTER 14. DUPLICATION148
> lowers before returning a response to the client, which comes with
> a performance penalty. If a replica is extremely slow, every request
> will be affected by it. To the extreme, if any replica is down or not
> reachable, the storebecomes unavailable and it can no longer write
> any data. The more nodes the data store has, the more likely a fault
> becomes.
> As you can see, fully synchronous or asynchronous replication are

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies, performance engineering

---

> CHAPTER 14. DUPLICATION149
> Figure 14.7:Multi-leader replication
> can be mitigated with a backup data center in the same region,
> replicated with single-leader replication.
> If assigning requests to specific leaders is not possible, and every
> client needs to be able to write to every leader, conflicting writes
> will inevitably happen.
> One way to deal with a conflict updating a record is to store the
> concurrent writes and return them to the next client that reads

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, multi-leader replication, leaderless replication, data replication strategies

---

> 159
> Chapter15describes the causes of the most common failures in
> distributed systems: single points of failure, unreliable networks,
> slow processes, and unexpected load.
> Chapter
> 16dives into resiliency patterns that help shield a ser-
> vice against failures in downstream dependencies, like timeouts,
> retries, and circuit breakers.
> Chapter17discusses resiliency patterns that help protect a service
> against upstream pressure, like load shedding, load leveling, and
> rate-limiting.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, resiliency, microservices, load shedding and load leveling, service mesh

---

> fice consistency and keep our system up, or maintain consistency
> and stop serving requests. In our case, temporarily rejecting all
> incoming requests just because the database used for rate-limiting
> is not reachable could be very damaging to the business. Instead,
> it’s safer to keep serving requests based on the last state read from
> the store.
> 17.4 Bulkhead
> The goal of the bulkhead pattern is to isolate a fault in one part of a
> service from taking the entire service down with it. The pattern is

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, bulkhead pattern, rate-limiting and throttling, database systems, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION116
> to it. Additionally, whenever the API of service changes, the gate-
> way needs to be modified as well.
> The other downside is that the API gateway is one more service
> that needs to be developed, maintained, and operated. Also, it
> needs to be able to scale to whatever the request rate is for all the
> services behind it. That said, if an application has dozens of ser-
> vices and APIs, the upside is greater than the downside and it’s

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, apis, api gateway, service mesh

---

> 7 Failure detection57
> 8 Time59
> 8.1  Physical clocks. . . . . . . . . . . . . . . . . . . .60
> 8.2  Logical clocks. . . . . . . . . . . . . . . . . . . . .61
> 8.3  Vector clocks. . . . . . . . . . . . . . . . . . . . .63
> 9 Leader election65
> 9.1  Raft leader election. . . . . . . . . . . . . . . . . .65
> 9.2  Practical considerations. . . . . . . . . . . . . . . .67
> 10 Replication71
> 10.1 State machine replication. . . . . . . . . . . . . . .72

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, raft leader election, leader election state machine, vector clocks

---

> Chapter 5
> APIs
> A service exposes operations to its consumers via a set of interfaces
> implemented by its business logic. As remote clients can’t access
> these directly, adapters — which make up the service’s application
> programming interface (API) — translate messages received from
> IPC mechanisms to interface calls, as shown in Figure5.1.
> The communication style between a client and a service can be
> directorindirect, depending on whether the client communicates

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, operations, microservices, apis, service mesh

---

> heart, DNS is a distributed, hierarchical, and eventually consistent
> key-value store. By studying it, we will get a first taste of eventu-
> ally consistency.
> Chapter5concludes this part by discussing how services can ex-
> pose APIs that other nodes can use to send commands or notifi-
> cations to. Specifically, we will dive into the implementation of a
> RESTful HTTP API.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, restful http, eventual consistency

---

> CHAPTER 2. RELIABLE LINKS25
> Figure 2.1:Three-way handshake
> closed to release all resources on both ends. This termination
> phase involves multiple round-trips.
> 2.3 Flow control
> Flow control is a backoff mechanism implemented to prevent the
> sender from overwhelming the receiver. The receiver stores incom-
> ing TCP segments waiting to be processed by the process into a
> receive buffer, as shown in Figure2.2.
> The receiver also communicates back to the sender the size of the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** reliable links, three-way handshake, flow control, tls handshake

---

> CHAPTER 2. RELIABLE LINKS29
> nisms that TCP provides, what you get is a simple protocol named
> User Datagram Protocol
> 6
> (UDP) — a connectionless transport layer
> protocol that can be used as an alternative to TCP.
> Unlike TCP, UDP does not expose the abstraction of a byte
> stream to its clients.  Clients can only send discrete packets,
> called datagrams, with a limited size.  UDP doesn’t offer any
> reliability as datagrams don’t have sequence numbers and are

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** link layer, transport layer, reliable links, tcp reliability

---

> not acknowledged. UDP doesn’t implement flow and congestion
> control either. Overall, UDP is a lean and barebone protocol. It’s
> used to bootstrap custom protocols, which provide some, but not
> all, of the stability and reliability guarantees that TCP does
> 7
> .
> For example, in modern multi-player games, clients sample
> gamepad, mouse and keyboard events several times per second
> and send them to a server that keeps track of the global game state.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** tcp reliability, flow control, congestion control, congestion window

---

> •Thepartially synchronousmodel assumes that the system be-
> haves synchronously mostof the time, but occasionally itcan
> regress to an asynchronous mode. This model is typically
> representative enough of practical systems.
> In the rest of the book, we will generally assume a system model
> with fair-loss links, nodes with crash-recovery behavior, and par-
> tial synchrony. For the interested reader, “Introduction to Reliable
> and Secure Distributed Programming”
> 3
> is an excellent theoretical

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, reliable links, fair-loss link model, reliable link model

---

> lower is elected as the new leader. But, there is a caveat: because
> the replication algorithm only needs a majority of the processes
> to make progress, it’s possible that when a leader fails, some pro-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> changed as distributed data stores have continued to add features
> that only traditional databases offered, and ACID transactions
> have become the norm rather than the exception. For example,
> Google’s Spanner
> 12
> implements transactions across partitions
> using a combination of 2PC and state machine replication.
> 11.4 Asynchronous transactions
> 2PC is a synchronous blocking protocol; if any of the participants
> isn’t available, the transaction can’t make any progress, and the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, state machine replication, replication, transactions

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION113
> ample, the API gateway could cache frequently accessed resources
> to improve the API’s performance while reducing the bandwidth
> requirements on the services or rate-limit requests to protect the
> services from being overwhelmed.
> Among the most critical cross-cutting aspects of securing a service,
> authentication and authorization are top-of-mind.Authentication
> is the process of validating that a so-called principal — a human

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, api gateway, performance engineering

---

> This separation adds more complexity to the system. For exam-
> ple, when the data model changes, both paths might need to be
> updated. Similarly, operational costs increase as there are more
> moving parts to maintain and operate. Also, there is an inherent
> replication lag between the time a change has been applied on the
> write path and the read path has received and applied it, which
> makes the system sequentially consistent.
> 12
> https://martinfowler.com/bliki/CQRS.html

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> CHAPTER 13. PARTITIONING131
> Ring hashing is an example of stable hashing. With ring hashing,
> a function maps a key to a point on a circle. The circle is then split
> into partitions that can be evenly or pseudo-randomly spaced, de-
> pending on the specific algorithm. When a new partition is added,
> it can be shown that most keys don’t need to be shuffled around.
> For example, withconsistent hashing
> 1
> , both the partition identifiers
> and keys are randomly distributed on a circle, and each key is as-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, range partitioning, hash partitioning, consistent hashing and ring hashing

---

> proach, the clients send writes exclusively to the leader, which up-
> dates its local state and replicates the change to the followers. We
> have seen an implementation of this when we discussed the Raft
> replication algorithm.
> At a high level, the replication can happen either fully syn-
> chronously, fully asynchronously, or as a combination of the
> two.
> Asynchronous replication
> In this mode, when the leader receives a write request from a client,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> CHAPTER 14. DUPLICATION147
> Figure 14.6:Single leader replication
> it asynchronously sends out requests to the followers to replicate it
> and replies to the client before the replication has been completed.
> Although this approach is fast, it’s not fault-tolerant. What hap-
> pens if the leader crashes right after accepting a write, but before
> replicating it to the followers? In this case, a new leader could be
> elected that doesn’t have the latest updates, leading to data loss,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> Synchronous replication waits for a write to be replicated to all fol-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> accept writes. This approach is used when the write throughput
> is too high for a single node to handle, or when a leader needs to
> be available in multiple data centers to be geographically closer to
> its clients.
> The replication happens asynchronously since the alternative
> would defeat the purpose of using multiple leaders in the first
> place. This form of replication is generally best avoided when
> possible as it introduces a lot of complexity. The main issue with

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> 14.2.3 Leaderless replication
> What if any replica could accept writes from clients? In that case,
> there wouldn’t be any leader(s), and the responsibility of repli-
> cating and resolving conflicts would be offloaded entirely to the
> clients.
> For this to work, a basic invariant needs to be satisfied. Suppose
> thedatastorehasNreplicas. Whenaclientsendsawriterequestto
> the replicas, it waits for at least W replicas to acknowledge it before
> moving on. And when it reads an entry, it does so by querying R

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** state machine replication, replication, leaderless replication, data replication strategies

---

> CHAPTER 14. DUPLICATION155
> Figure 14.9:Out-of-process cache
> drop and that the number of cache misses doesn’t significantly
> increase. Consistent hashing, or a similar partitioning technique,
> can be used to reduce the amount of data that needs to be moved
> around.
> Maintaininganexternalcachecomeswithapriceasit’syetanother
> service that needs to be maintained and operated. Additionally,
> the latency to access it is higher than accessing an in-process cache
> because a network call is required.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, range partitioning, hash partitioning, service mesh

---

> CHAPTER 17. UPSTREAM RESILIENCY178
> Figure 17.1:The channel smooths out the load for the consuming
> service.
> Load-shedding and load leveling don’t address an increase in load
> directly, but rather protect a service from getting overloaded. To
> handle more load, the service needs to be scaled out. This is why
> these protection mechanisms are typically combined with auto-
> scaling
> 2
> , which detects that the service is running hot and auto-
> matically increases its scale to handle the additional load.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, load shedding and load leveling, service mesh

---

> CHAPTER 17. UPSTREAM RESILIENCY180
> Although rate-limiting has some similarities to load shedding,
> they are different concepts. Load shedding rejects traffic based
> on the local state of a process, like the number of requests concur-
> rently processed by it; rate-limiting instead sheds traffic based on
> the global state of the system, like the total number of requests
> concurrently processed for a specific API key across all service
> instances.
> 17.3.1 Single-process implementation

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, rate-limiting and throttling, service mesh

---

> CHAPTER 16. DOWNSTREAM RESILIENCY173
> Having retries at multiple levels of the dependency chain can am-
> plify the number of retries; the deeper a service is in the chain, the
> higher the load it will be exposed to due to the amplification (see
> Figure16.2).
> Figure 16.2:Retry amplification in action
> And if the pressure gets bad enough, this behavior can easily bring
> down the whole system. That’s why when you have long depen-
> dency chains, you should only retry at a single level of the chain,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, transactions, retry amplification, service mesh

---

> Chapter 21
> Observability
> A distributed system is never 100% healthy at any given time
> as there can always be something failing.  A whole range of
> failure modes can be tolerated, thanks to relaxed consistency
> models and resiliency mechanisms like rate limiting, retries, and
> circuit breakers. Unfortunately, they also increase the system’s
> complexity. And with more complexity, it becomes increasingly
> harder to reason about the multitude of emergent behaviours the
> system might experience.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, resiliency, consistency models, observability engineering

---

> resolutions because it has a datacenter close to you.
> This book will guide you through the fundamental challenges that
> need to be solved to design, build and operate distributed sys-
> tems: communication, coordination, scalability, resiliency, and op-
> erations.
> 1.1 Communication
> The first challenge comes from the fact that nodes need to commu-
> nicate over the network with each other. For example, when your
> browser wants to load a website, it resolves the server’s address

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication, coordination, scalability, resiliency

---

> 22
> to another across the network. The Internet Protocol (IP) is the core
> protocol of this layer, which delivers packets on a best-effort basis.
> Routers operate at this layer and forward IP packets based on their
> destination IP address.
> Thetransport layertransmits data between two processes using
> port numbers to address the processes on either end. The most
> important protocol in this layer is the Transmission Control
> Protocol (TCP).
> Theapplication layerdefines high-level communication protocols,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, internet layer, transport layer, application layer

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION121
> Broadcast messaging
> In this messaging style, a producer writes a message to a publish-
> subscribe channel to broadcast it to all consumers (see Figure12.8).
> This mechanism is generally used to notify a group of processes
> that a specific event has occurred. We have already encountered
> this pattern when discussing log-based transactions in section
> 11.4.1.
> Figure 12.8:Broadcast messaging style
> 12.4.1 Guarantees

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** functional decomposition, messaging, log-based transactions, transactions

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION105
> Figure 12.2:A backend split into independently deployable ser-
> vices that communicate via APIs.
> have to stick to microservices.
> 12.1.1 Benefits
> Breaking down the backend by business capabilities into a set of
> services with well-defined boundaries allows each service to be
> developed and operated by a single small team. Smaller teams
> can increase the application’s development speed for a variety of
> reasons:

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, apis, service mesh

---

> Figure1.1. If the load on the system continues to grow, it will even-
> tually hit a point where most operations fail or timeout.
> Figure 1.1:The system throughput on the y axis is the subset of
> client requests (x axis) that can be handled without errors and with
> low response times, also referred to as its goodput.
> The capacity of a distributed system depends on its architecture
> andanintricatewebofphysicallimitationslikethenodes’memory
> size and clock cycle, and the bandwidth and latency of network

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, operations, system architecture, serverless architectures

---

> CHAPTER 20. MONITORING217
> 20.4 Alerts
> Alerting is the part of a monitoring system that triggers an action
> when a specific condition happens, like a metric crossing a thresh-
> old. Depending on the severity and the type of the alert, the action
> triggered can range from running some automation, like restarting
> a service instance, to ringing the phone of a human operator who
> is on-call. In the rest of this section, we will be mostly focusing on
> the latter case.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, burn rate alerting, service mesh

---

> CHAPTER 11. TRANSACTIONS92
> search or analytics. Suppose we own a product catalog service
> backed by a relational database, and we decided to offer an ad-
> vanced full-text search capability in its API. Although some rela-
> tional databases offer basic full-text search functionality, a dedi-
> cated database such as Elasticsearch is required for more advanced
> use cases.
> To integrate with the search index, the catalog service needs to up-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, database systems, service mesh

---

> between strong consistency and availability, as network faults are
> a given and can’t be avoided.
> Even though network partitions can happen, they are usually rare.
> But, there is a trade-off between consistency and latency in the ab-
> sence of a network partition. The stronger the consistency guar-
> antee is, the higher the latency of individual operations must be.
> This relationship is expressed by thePACELC theorem
> 7
> . It states
> that in case of network partitioning (P) in a distributed computer

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, operations, range partitioning, hash partitioning

---

> directly with the service or indirectly with it through a broker. Di-
> rect communication requires that both processes are up and run-
> ning for the communication to succeed. However, sometimes this
> guarantee is either not needed or very hard to achieve, in which
> case indirect communication can be used.
> In this chapter, we will focus our attention on a direct communi-
> cation style calledrequest-response, in which a client sends arequest

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, microservices, request-response style, service mesh

---

> Introduction
> Now that we understand how to coordinate processes, we
> are ready to dive into one of the main use cases for building
> distributed systems: scalability.
> A scalable application can increase its capacity as its load increases.
> The simplest way to do that is byscaling upand running the appli-
> cation on more expensive hardware, but that only brings you so far
> since the application will eventually reach a performance ceiling.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication, scalability, performance engineering

---

> help much as the issue is intrinsic with the requests sent by that
> client, which could eventually lead to degrading the service for
> every other client.
> When everything else fails, the bulkhead pattern provides guar-
> anteed fault isolation by design. The idea is to partition a shared
> resource, like a pool of service instances behind a load balancer,
> and assign each user of the service to a specific partition so that its
> requests can only utilize resources belonging to the partition it’s

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, range partitioning, bulkhead pattern, service mesh

---

> 14.1.2 Transport layer load balancing. . . . . . . .138
> 14.1.3 Application layer load balancing. . . . . .141
> 14.1.4 Geo load balancing. . . . . . . . . . . . . .143

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transport layer, application layer, geo load balancing

---

> pening at any time. Alerts need to fire when its service level objec-
> tives are at risk of being breached, and a human needs to be looped
> in. The book’s final part explores best practices to test and operate
> distributed systems.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, microservices, service mesh

---

> and duplicated. If the sender keeps retransmitting a mes-
> sage, eventually it will be delivered to the destination.
> •Thereliable linkmodel assumes that a message is delivered
> exactly once, without loss or duplication. A reliable link can
> be implemented on top of a fair-loss one by de-duplicating
> messages at the receiving side.
> •Theauthenticated reliable linkmodel makes the same assump-
> tions as the reliable link, but additionally assumes that the
> receiver can authenticate the message’s sender.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** fair-loss link model, reliable link model, authenticated reliable link

---

> be repartitioned, which can temporarily degrade the broker since
> messages need to be reshuffled across all partitions. Later in the
> chapter, we will learn more about the pros and cons of partition-
> ing.
> Now you see why not having to guarantee the order of messages
> makes the implementation of a broker much simpler. Ordering is
> just one of the many tradeoffs a broker needs to make, such as:
> •delivery guarantees, like at-most-once or at-least-once;
> •message durability guarantees;
> •latency;

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** udp tradeoffs, message durability and delivery guarantees, at-least-once and at-most-once delivery

---

> the server the cost of handling it. Depending on how the rejec-
> tion is implemented, the server might still have to pay the price of
> opening a TLS connection and read the request just to finally reject
> it. Hence, load shedding can only help so much, and if the load
> keeps increasing, eventually, the cost of rejecting requests takes
> over, and the service starts to degrade.
> 17.2 Load leveling
> Loadlevelingisanalternative toload shedding, which can beused

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, load shedding and load leveling, service mesh

---

> named after the partitions of a ship’s hull. If one partition is dam-
> aged and fills up with water, the leak is isolated to that partition
> and doesn’t spread to the rest of the ship.
> Some clients can create much more load on a service than others.
> Withoutanyprotections, asinglegreedyclientcanhammerthesys-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, range partitioning, service mesh

---

> perceive the performance and health of a service from the outside.
> A common approach is to periodically run scripts
> 2
> that send test
> requests to external API endpoints and monitor how long they
> 1
> https://codeascraft.com/2011/02/15/measure-anything-measure-everythi
> ng/
> 2
> https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/C
> loudWatch_Synthetics_Canaries.html

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, performance engineering

---

> CHAPTER 14. DUPLICATION137
> ancing using delayed load metrics is not possible?
> Actually, there is a way, but it requires combining load metrics
> with the power of randomness. The idea is to randomly pick two
> servers from the pool and route the request to the least-loaded one
> of the two. This approach
> 1
> works remarkably well as it combines
> delayed load information with the protection against herding that
> randomness provides.
> Service Discovery

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, discovery, service discovery, service mesh

---

> a sharded key-value store.
> 13.1 Sharding strategies
> When a client sends a request to a partitioned data store to read or
> write a key, the request needs to be routed to the node responsible
> for the partition the key belongs to. One way to do that is to use a
> gateway service that can route the request to the right place know-
> ing how keys are mapped to partitions and partitions to nodes.
> The mapping between keys and partitions, and other metadata, is

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, range partitioning, retry strategies, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION106
> nication is required, and therefore decisions can be taken in
> less time.
> •The codebase of a service is smaller and easier to digest by its
> developers, reducing the time it takes to ramp up new hires.
> Also, a smaller codebase doesn’t slow down IDEs as much,
> which makes developers more productive.
> •The boundaries between services are much stronger than the
> boundaries between components in the same process. Be-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, microservices, functional decomposition, service mesh

---

> request a process receives, it needs to do an outgoing call to a re-
> mote data store. What should it do if it fails?
> Let’s address these issues. Rather than using transactions, we
> can use a single atomicget-and-incrementoperation that most
> data stores provide.  Alternatively, the same can be emulated
> with acompare-and-swap
> 4
> . Atomic operations have much better
> performance than transactions.
> Now, rather than updating the database on each request, the pro-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, transactions, database systems, performance engineering

---

> buffer whenever it acknowledges a segment, as shown in Figure
> 2.3. The sender, if it’s respecting the protocol, avoids sending more
> data that can fit in the receiver’s buffer.
> This mechanism is not too dissimilar to rate-limiting
> 3
> at the service
> level. But, rather than rate-limiting on an API key or IP address,
> TCP is rate-limiting on a connection level.
> 3
> https://en.wikipedia.org/wiki/Rate_limiting

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, rate-limiting and throttling, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION123
> •Channels are point-to-point and support an arbitrary num-
> ber of producers and consumers.
> •Messages are delivered to consumers at-least-once.
> •While a consumer is processing a message, the message re-
> mains persisted in the channel, but other consumers can’t
> read it for the duration of a visibility timeout. Thevisibility
> timeoutguarantees that if the consumer crashes while pro-
> cessingthemessage, themessagewillbecomevisibletoother

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** functional decomposition, visibility timeout, stream processing

---

> ceed, or neither do. To achieve that, the withdrawal and deposit
> need to be wrapped in an inseparable unit: a transaction.
> In a traditional relational database, a transaction is a group of
> operations for which the database guarantees a set of properties,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, transactions, database systems

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION108
> behavior can emerge when individual services interact with each
> other.
> Operations
> Unlike with a monolith, it’s much more expensive to staff each
> team responsible for a service with its own operations team. As
> a result, the team that develops a service is typically also on-call
> for it. This creates friction between adding new features and op-
> erating the service as the team needs to decide what to prioritize
> during each sprint.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, microservices, functional decomposition, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION104
> Figure 12.1:A monolithic backend composed of multiple compo-
> nents.
> introduces a bug like a memory leak, the entire service can poten-
> tially be affected by it. Additionally, rolling back a faulty build
> affects the velocity of all teams, not just the one that introduced
> the bug.
> Oneway to mitigate the growing painsof amonolithicbackend isto
> split it into a set of independently deployable services that commu-
> nicate via APIs, as shown in Figure

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, apis, service mesh

---

> way to identify which application is making a request and limit
> what they can do. This approach is popular for public APIs, like
> the one offered by Github or Twitter.
> 12.2.5 Caveats
> One of the drawbacks of using an API gateway is that it can be-
> come a development bottleneck. As it’s coupled with the services
> it’s hiding, every new service that is created needs to be wired up
> 6
> https://jwt.io/
> 7
> https://openid.net/connect/
> 8
> https://oauth.net/2/
> 9

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, api gateway, service mesh

---

> 101
> an application after it has been decomposed into services using an
> API gateway. The gateway acts as the proxy for the application by
> routing, composing, and translating requests.
> Section
> 12.3discusses how to decouple an API’s read path from its
> write path so that their respective implementations can use differ-
> ent technologies that fit their specific use cases.
> Section12.4dives into asynchronous messaging channels that de-
> couple producers on one end of a channel from consumers on the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, secure channels, api gateway, messaging

---

> date both the relational database and the search index when a new
> productisaddedoranexistingproductismodifiedordeleted. The
> service could just update the relational database first, and then the
> search index; but if the service crashes before updating the search
> index, the system would be left in an inconsistent state. As you can
> guess by now, we need to wrap the two updates into a transaction
> somehow.
> We could consider using 2PC, but while the relational database
> supports the X/Open XA
> 14

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, database systems, service mesh

---

> servers can interchangeably be used to handle requests, a LB can
> detect faulty ones and take them out of the pool, increasing the
> service’s availability.
> At a high level, a LB supports several core features beyond load
> balancing, like service discovery and health-checks.
> Load Balancing
> The algorithms used for routing requests can vary from simple
> round-robin to more complex ones that take into account the
> servers’ load and health. There are several ways for a LB to infer

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, discovery, service discovery, service mesh

---

> things simple and have as few as possible that provide a good
> enough indication of the desired service level. SLOs should also
> be documented and reviewed periodically. For example, suppose
> you discover that a specific user-facing issue generated lots of sup-
> port tickets, but none of your SLOs showed any degradations. In
> that case, they are either too relaxed, or you are not measuring
> something that you should.
> SLOs need to be agreed on with multiple stakeholders. Engineers

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, discovery, service discovery, service mesh

---

> messengers increases the general’s confidence, it never reaches ab-
> solute certainty.
> Because coordination is such a key topic, the second part of this
> book is dedicated to distributed algorithms used to implement co-
> ordination.
> 1.3 Scalability
> Theperformanceofadistributedsystemrepresentshowefficiently
> it handles load, and it’s generally measured withthroughputand
> response time. Throughput is the number of operations processed
> per second, and response time is the total time between a client

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, coordination, scalability, operations

---

> you better be prepared to maintain it for a very long time.
> As is typical in computer science, we can solve this problem by
> adding a layer of indirection. The internal APIs can be hidden by
> a public one that acts as a facade, or proxy, for the internal services
> (see Figure
> 12.3). The service that exposes the public API is called
> theAPI gateway, which is transparent to its clients since they have
> no idea they are communicating through an intermediary.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, api gateway, service mesh

---

> Service discovery is the mechanism used by the LB to discover the
> available servers in the pool it can route requests to. There are
> various ways to implement it. For example, a simple approach is
> to use a static configuration file that lists the IP addresses of all the
> servers. However, this is quite painful to manage and keep up-
> to-date. A more flexible solution can be implemented with DNS.
> Finally, using a data store provides the maximum flexibility at the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, discovery, service discovery, service mesh

---

> 18
> pattern provides a solution to this problem. A saga is
> a distributed transaction composed of a set of local transactions
> 푇
> 1
> , 푇
> 2
> , ..., 푇
> 푛
> , where푇
> 푖
> has a corresponding compensating local
> transaction퐶
> 푖
> used to undo its changes. The Saga guarantees that
> either all local transactions succeed, or in case of failure, that the
> compensating local transactions undo the partial execution of the
> transaction altogether. This guarantees the atomicity of the pro-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, transactions, sagas and compensating actions

---

> 17.3 Rate-limiting
> Rate-limiting, or throttling, is a mechanism that rejects a request
> when a specific quota is exceeded. A service can have multiple
> quotas, likeforthenumberofrequestsseen, orthenumberofbytes
> received within a time interval. Quotas are typically applied to
> specific users, API keys, or IP addresses.
> For example, if a service with a quota of 10 requests per second,
> per API key, receives on average 12 requests per second from a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, rate-limiting and throttling, service mesh

---

> CHAPTER 13. PARTITIONING130
> — keys across partitions, as shown in Figure13.2. Another way
> to think about it is that the hash function maps a potentially non-
> uniformly distributed key space to a uniformly distributed hash
> space.
> For example, a simple version of hash partitioning can be imple-
> mented with modular hashing, i.e., hash(key) mod N.
> Figure 13.2:A hash partitioned dataset
> Although this approach ensures that the partitions contain more

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, range partitioning, hash partitioning

---

> interface defines operations that the service uses to communicate
> with external services, like data stores, messaging services, and so
> on.
> Remote clients can’t just invoke an interface, which is why
> adapters
> 2
> are required to hook up IPC mechanisms with the
> service’s interfaces. An inbound adapter is part of the service’s
> Application Programming Interface(API); it handles the requests
> received from an IPC mechanism, like HTTP, by invoking oper-
> 2
> http://wiki.c2.com/?PortsAndAdaptersArchitecture

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, microservices, messaging, service mesh

---

> CHAPTER 2. RELIABLE LINKS27
> 2.4 Congestion control
> TCP not only guards against overwhelming the receiver, but also
> against flooding the underlying network.
> The sender estimates the available bandwidth of the underlying
> network empirically through measurements. The sender main-
> tains a so-calledcongestion window, which represents the total num-
> ber of outstanding segments that can be sent without an acknowl-
> edgment from the other side. The size of the receiver window lim-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** reliable links, congestion control, congestion window

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION124
> 12.4.3 Failures
> When a consumer fails to process a message, the visibility timeout
> triggers, and the message is eventually delivered to another con-
> sumer. What happens if processing a specific message consistently
> fails with an error, though? To guard against the message being
> picked up repeatedly in perpetuity, we need to limit the maximum
> number of times the same message can be read from the channel.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** functional decomposition, visibility timeout, stream processing

---

> ms just because of the network latency, which is physically limited
> by the speed of light. Not to mention the increased error rate when
> sending data across the public internet over long distances.
> To mitigate these performance issues, you can distribute the traffic
> to different data centers located in different regions. But how do
> you ensure that the clients communicate with the geographically
> closest L4 load balancer?
> This is where DNS geo load balancing
> 10
> comes in — it’s an exten-
> 9

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, geo load balancing, performance engineering

---

> network’sbandwidthisutilized. Thisismorereasontoputservers
> geographically close to the clients.
> 2.5 Custom protocols
> TCP’sreliabilityandstabilitycomeatthepriceoflowerbandwidth
> and higher latencies than the underlying network is actually capa-
> ble of delivering. If you drop the stability and reliability mecha-
> 5
> https://en.m.wikipedia.org/wiki/Bandwidth-delay_product

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** tcp reliability, bandwidth-delay product

---

> otherwise it routes the request to a DNS resolver. The DNS
> resolver is typically a DNS server hosted by your Internet
> Service Provider.
> 1
> https://en.wikipedia.org/wiki/Domain_Name_System

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> The most commonly used methods arePOST,GET,PUT, and
> DELETE. For example, the API of our catalog service could be
> defined as follows:
> 11
> https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiati
> on

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> will learn about a family of clocks that can be used to work out the
> order of operations across processes in a distributed system.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, operations

---

> The election timeout is picked randomly from a fixed inter-
> val to reduce the likelihood of another split vote in the next
> election.
> Figure 9.1:Raft’s leader election algorithm represented as a state
> machine.
> 9.2 Practical considerations
> There are many more leader election algorithms out there than
> the one presented here, but Raft’s implementation is a modern
> take on the problem optimized for simplicity and understandabil-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** raft leader election, leader election state machine

---

> what differentiates sequential consistency from linearizability.
> 5
> https://jepsen.io/consistency/models/sequential

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** consistency models, sequential consistency

---

> performance or stronger consistency guarantees, like Azure’s
> Cosmos DB
> 8
> and Cassandra
> 9
> . Because of that, you need to know
> what the trade-offs are. With what you have learned here, you
> 6
> https://en.wikipedia.org/wiki/CAP_theorem
> 7
> https://en.wikipedia.org/wiki/PACELC_theorem
> 8
> https://docs.microsoft.com/en-us/azure/cosmos-db/consistency-levels
> 9
> https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/dml/dmlCon
> figConsistency.html

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** cap theorem and pacelc, performance engineering

---

> to a library requires the service to be redeployed. And if a change

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> ture is service-oriented architecture
> 1
> , but unfortunately, that name
> comes with some old baggage as well. Perhaps in 10 years, we will
> call the same concept with yet another name, but for now we will
> 1
> https://en.wikipedia.org/wiki/Service-oriented_architecture

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** service-oriented architecture, serverless architectures

---

> 13.1.2 Hash partitioning
> The idea behind hash partitioning is to use a hash function to as-
> sign keys to partitions, which shuffles — or uniformly distributes

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** range partitioning, hash partitioning

---

> the traffic upstream. The beauty of this approach is that the cost
> of running the frontend service is amortized across all the services
> that are using it.
> 3
> https://en.wikipedia.org/wiki/Denial-of-service_attack

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> •Request handling duration, availability and response time of
> external dependencies, etc.
> •Counts per response type, size of responses, etc.
> Service dashboard

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION120
> Figure 12.6:One-way messaging style
> Request-response messaging
> This messaging style is similar to the direct request-response style
> we are familiar with, albeit with the difference that the request
> and response messages flow through channels. The consumer has
> a point-to-point request channel from which it reads messages,
> while every producer has its own dedicated response channel (see
> Figure12.7).

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** functional decomposition, request-response style, messaging

---

> clients, removing the need for a dedicated service that needs to be
> scaled out and maintained. The con is a significant increase in the
> system’s complexity.
> 14.1.4 Geo load balancing
> When we first discussed TCP in chapter2, we talked about the
> importanceofminimizingthelatencybetweenaclientandaserver.
> No matter how fast the server is, if the client is located on the other
> side of the world from it, the response time is going to be over 100

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, geo load balancing, service mesh

---

> 10.2 Consensus. . . . . . . . . . . . . . . . . . . . . . .75
> 10.3 Consistency models. . . . . . . . . . . . . . . . . .75
> 10.3.1 Strong consistency. . . . . . . . . . . . . .77
> 10.3.2 Sequential consistency. . . . . . . . . . . .78
> 10.3.3 Eventual consistency. . . . . . . . . . . . .80
> 10.3.4 CAP theorem. . . . . . . . . . . . . . . . .80
> 10.4 Practical considerations. . . . . . . . . . . . . . . .81
> 11 Transactions83
> 11.1 ACID. . . . . . . . . . . . . . . . . . . . . . . . .83

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** consensus, consistency models, sequential consistency, eventual consistency, transactions

---

> connection, and to the very least download part of the request to
> read the key. Although rate-limiting doesn’t fully protect against
> DDoS attacks, it does help reduce their impact.
> Economies of scale are the only true protection against DDoS at-
> tacks. If you run multiple services behind one large frontend ser-
> vice, no matter which of the services behind it are attacked, the
> frontend service will be able to withstand the attack by rejecting

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, rate-limiting and throttling, service mesh

---

> facing issues; if it’s too strict, you will waste engineering time
> micro-optimizing and get diminishing returns.  Even if you
> could guarantee 100% reliability for your system, you can’t make
> guarantees for anything that your users depend on to access
> your service that is outside your control, like their last-mile
> connection. Thus, 100% reliability doesn’t translate into a 100%
> reliable experience for users.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, tcp reliability, service mesh

---

> Chapter 13
> Partitioning
> Now it’s time to change gears and dive into another tool you have
> at your disposal to scale out application — partitioning or shard-
> ing.
> When a dataset no longer fits on a single node, it needs to be par-
> titioned across multiple nodes. Partitioning is a general technique
> that can be used in a variety of circumstances, like sharding TCP
> connections across backends in a load balancer. To ground the dis-
> cussion in this chapter, we will anchor it to the implementation of

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** partitioning and sharding, range partitioning, hash partitioning

---

> paths of a service that communicate with an external dependency,
> like the adapters and their supporting classes. In contrast, a broad
> integration test exercises code paths across multiple live services.
> In the rest of the chapter, we will refer to these broader integration
> tests as end-to-end tests. Anend-to-end testvalidates behavior that
> spans multiple services in the system, like a user-facing scenario.
> 2
> https://martinfowler.com/bliki/IntegrationTest.html

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, continuous integration

---

> CHAPTER 21. OBSERVABILITY226
> increaseinvariancewithanincreaseintraffic, theoperatorhypoth-
> esizes that the service is getting closer to hitting a constraint, like a
> limit or a resource contention. Metrics and charts alone won’t help
> to validate this hypothesis.
> Observability is a set of tools that provide granular insights into
> a system in production, allowing us to understand its emergent
> behaviours. A good observability platform strives to minimize the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, observability engineering

---

> travel service has to atomically book a flight through a dedicated
> service and a hotel through another. However, either of these ser-
> vices can fail their respective requests. If one booking succeeds,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 1. INTRODUCTION17
> 1.6 Anatomy of a distributed system
> Distributed systems come in all shapes and sizes. The book an-
> chors the discussion to the backend of systems composed of com-
> modity machines that work in unison to implement a business fea-
> ture. This comprises the majority of large scale systems being built
> today.
> Before we can start tackling the fundamentals, we need to discuss
> the different ways a distributed system can be decomposed into

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, anatomy of a distributed system

---

> CHAPTER 11. TRANSACTIONS97
> Figure 11.5:A workflow implementing an asynchronous transac-
> tion.
> message to appear twice at the receiving end. Hence, the partici-
> pantshavetode-duplicatethemessagestheyreceivetomakethem
> idempotent.
> In practice, you don’t need to build orchestration engines from
> scratch to implement such workflows. Serverless cloud compute
> services such as AWS Step Functions
> 20
> or Azure Durable Func-
> tions
> 21
> make it easy to create fully-managed workflows.
> 11.4.3 Isolation

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, containerization and orchestration

---

> CONTENTS3
> 11.4 Asynchronous transactions. . . . . . . . . . . . . .91
> 11.4.1 Log-based transactions. . . . . . . . . . . .91
> 11.4.2 Sagas. . . . . . . . . . . . . . . . . . . . . .94
> 11.4.3 Isolation. . . . . . . . . . . . . . . . . . . .97
> III Scalability99
> 12 Functional decomposition103
> 12.1 Microservices. . . . . . . . . . . . . . . . . . . . .103
> 12.1.1 Benefits. . . . . . . . . . . . . . . . . . . .105
> 12.1.2 Costs. . . . . . . . . . . . . . . . . . . . . .106

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, microservices, functional decomposition, log-based transactions, transactions

---

> Chapter 6
> System models
> To reason about distributed systems, we need to define precisely
> what can and can’t happen. Asystem modelencodes assumptions
> about the behavior of nodes, communication links, and timing;
> think of it as a set of assumptions that allow us to reason about
> distributed systems by ignoring the complexity of the actual tech-
> nologies used to implement them.
> Let’s start by introducing some models for communication links:
> •Thefair-loss linkmodel assumes that messages may be lost

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication, fair-loss link model

---

> them pay proportionally to their usage and enforce pricing tiers
> with quotas.
> You would think that rate-limiting also offers strong protection
> against a denial-of-service
> 3
> (DDoS) attack, but it only partially
> protects a service from it. Nothing forbids throttled clients from
> continuing to hammer a service after getting429s. And no, rate-
> limited requests aren’t free either — for example, to rate-limit a
> request by API key, the service has to pay the price to open a TLS

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, rate-limiting and throttling, service mesh

---

> service for some time, protecting it from non-malicious users mo-
> nopolizing it by mistake. This protects against bugs in the clients
> that, for one reason or another, cause a client to repeatedly hit a
> downstream service for no good reason.
> Rate-limiting is also used to enforce pricing tiers; if a user wants
> to use more resources, they also need to be prepared to pay more.
> This is how you can offload your service’s cost to your users: have

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, rate-limiting and throttling, service mesh

---

> Introduction
> Communication between processes over the network, orinter-
> process communication(IPC), is at the heart of distributed systems.
> Network protocols are arranged in a stack
> 3
> , where each layer
> builds on the abstraction provided by the layer below, and lower
> layers are closer to the hardware. When a process sends data to
> another through the network, it moves through the stack from the
> top layer to the bottom one and vice-versa on the other end, as
> shown in Figure1.4.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication, network protocol stack

---

> CHAPTER 2. RELIABLE LINKS28
> Figure 2.4:The lower the RTT is, the quicker the sender can start
> utilizing the underlying network’s bandwidth.
> Bandwidth=
> WinSize
> RTT
> The equation
> 5
> shows that bandwidth is a function of latency. TCP
> will try very hard to optimize the window size since it can’t do
> anything about the round trip time. However, that doesn’t always
> yield the optimal configuration. Due to the way congestion control
> works, the lower the round trip time is, the better the underlying

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** reliable links, congestion control, congestion window

---

> Raft is based on a technique known asstate machine replication. The
> main idea behind it is that a single process, the leader, broadcasts
> the operations that change its state to other processes, the follow-
> ers. If the followers execute the same sequence of operations as
> the leader, then the state of each follower will match the leader’s.
> Unfortunately, the leader can’t simply broadcast operations to the
> 1
> https://raft.github.io/

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, state machine replication, replication

---

> Continuous integration ensures that code changes are merged into
> the main branch after an automated build and test suites have run.
> Once a code change has been merged, it should be automatically
> published and deployed to a production-like environment, where
> a battery of integration and end-to-end tests run to ensure that the
> service doesn’t break any dependencies or use cases.
> While testing individual microservices is not more challenging

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, continuous integration

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION114
> mechanisms into a single component, hiding the complexity from
> internal services. In contrast, authorizing requests is best left to
> individual services to avoid coupling the API gateway with their
> domain logic.
> When the API gateway has authenticated a request, it creates a
> security token. The gateway passes this token to the internal ser-
> vices responsible for handling the request, which in turn will pass

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, api gateway

---

> are free to specify what they need. There is still an API, though; it
> just happens that it’s described with a graph schema. In a way, it’s
> as if the gateway grants the clients the ability to perform restricted
> queries on its backend APIs. GraphQL
> 4
> is the most popular tech-
> nology in the space at the time of writing.
> 12.2.4 Cross-cutting concerns
> As the API gateway is a proxy, or middleman, for the services be-
> hind it, it can also implement cross-cutting functionality that oth-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, microservices, apis, api gateway

---

> specific API key, it will on average, reject 2 requests per second
> tagged with that API key.
> When a service rate-limits a request, it needs to return a response
> with a particular error code so that the sender knows that it failed
> because a quota has been breached. For services with HTTP APIs,
> 2
> https://en.wikipedia.org/wiki/Autoscaling

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, service mesh

---

> can have a large amount of metadata associated with each metric,
> like datacenter, cluster, node, pod, service, etc. High-cardinality
> metrics make it easy to slice and dice the data, and eliminate the
> instrumentation cost of manually creating a metric for each label
> combination.
> A service should emit metrics about its load, internal state, and
> availability and performance of downstream service dependen-
> cies. Combined with the metrics emitted by downstream services,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, performance engineering

---

> The drawback of this approach is that the number of partitions
> is set when the data store is first initialized and can’t be easily
> changed after that. Getting the number of partitions wrong can be
> problematic — too many partitions add overhead and decrease the
> data store’s performance, while too few partitions limit the data
> store’s scalability.
> 13.2.2 Dynamic partitioning
> An alternative to creating partitions upfront is to create them on-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, range partitioning, hash partitioning

---

> Figure 1.4:Internet protocol suite
> Thelink layerconsists of network protocols that operate on local
> network links, like Ethernet or Wi-Fi, and provides an interface to
> the underlying network hardware. Switches operate at this layer
> and forward Ethernet packets based on their destination MAC ad-
> dress.
> Theinternetlayerusesaddressestoroutepacketsfromonemachine
> 3
> https://en.wikipedia.org/wiki/Internet_protocol_suite

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** link layer, internet layer

---

> WHAT EVERY DEVELOPER SHOULD KNOW ABOUT
> LARGE DISTRIBUTED APPLICATIONS
> Roberto Vitillo
> UNDERSTANDING
> DISTRIBUTED
> SYSTEMS

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems

---

> Understanding Distributed Systems
> Version 1.0.4
> Roberto Vitillo
> February 2021

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems

---

> Part I
> Communication

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication

---

> changing their public keys. This is possible thanks to some math-
> 1
> https://en.wikipedia.org/wiki/Transport_Layer_Security

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transport layer

---

> Part II
> Coordination

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** coordination

---

> Part III
> Scalability

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability

---

> application layer of the network stack. Finally, we will discuss

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** application layer

---

> 9
> https://www.manning.com/books/microservices-security-in-action

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices

---

> 9
> https://blog.envoyproxy.io/service-mesh-data-plane-vs-control-plane-
> 2774e720f7fc
> 10
> https://landing.google.com/sre/sre-book/chapters/load-balancing-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** service mesh

---

> Part IV
> Resiliency

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency

---

> Part V
> Testing and operations

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations

---

> range and resolution based on the most common use case for a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** name resolution

---

> timately familiar with the system’s architecture, brick walls, and

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** system architecture

---

> plication data;
> •HMAC algorithm used to guarantee the integrity and
> authenticity of the application data.
> 2.The parties use the negotiated key exchange algorithm to cre-
> ate a shared secret. The shared secret is used by the chosen
> symmetric encryption algorithm to encrypt the communica-
> tion of the secure channel going forwards.
> 3.The client verifies the certificate provided by the server. The
> verification process confirms that the server is who it says it

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** key exchange, replication, formal verification

---

> and data store(s) that best fit its use-cases, allowing develop-
> ers to change its schema without affecting other services.
> 12.1.2 Costs
> The microservice architecture adds more moving parts to the over-
> all system, and this doesn’t come for free. The cost of fully em-
> bracing microservices is only worth paying if it can be amortized
> across dozens of development teams.
> Development experience
> Nothing forbids the use of different languages, libraries, and data-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** system architecture, microservices, serverless architectures

---

> CHAPTER 1. INTRODUCTION15
> asscaling up. But that will hit a brick wall sooner or later. When
> that option is no longer available, the alternative isscaling outby
> adding more machines to the system.
> In the book’s third part, we will explore the main architectural pat-
> terns that you can leverage to scale out applications: functional
> decomposition, duplication, and partitioning.
> 1.4 Resiliency
> A distributed system is resilient when it can continue to do its job

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, resiliency, functional decomposition

---

> signed to the next partition that appears on the circle in clockwise
> order (see Figure13.3).
> Figure 13.3:With consistent hashing, partition identifiers and keys
> are randomly distributed on a circle, and each key is assigned to
> the next partition that appears on the circle in clockwise order.
> 1
> https://en.wikipedia.org/wiki/Consistent_hashing

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, range partitioning

---

> the need for joins but doesn’t completely eliminate it. For example,
> if a service calls another downstream, you will have to perform a
> join to correlate the caller’s event log with the callee’s one to un-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION122
> challenging as some form of coordination is required. Some bro-
> kers, like Kafka, partition a channel into multiple sub-channels,
> each small enough to be handled entirely by a single process. The
> idea is that if there is a single broker process responsible for the
> messages of a sub-channel, then it should be trivial to guarantee
> their order.
> In this case, when messages are sent to the channel, they are par-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** coordination, functional decomposition, range partitioning

---

> is. If the verification is successful, the client can start send-
> ing encrypted application data to the server. The server can
> optionally also verify the client certificate if one is available.
> These operations don’t necessarily happen in this order as modern
> implementations use several optimizations to reduce round trips.
> The handshake typically requires 2 round trips with TLS 1.2 and
> just one with TLS 1.3
> 7
> . The bottom line is creating a new connec-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, tls handshake, formal verification

---

> up the slack. To avoid this causing any performance degradation,
> there needs to be enough capacity left to sustain the incremental
> release.
> If the service is available in multiple regions, the CD pipeline
> should start with a low-traffic region first to reduce the impact
> of a faulty release. Releasing the remaining regions should be
> divided into sequential stages to minimize risks further. Natu-
> rally, the more stages there are, the longer the CD pipeline will

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, performance engineering

---

> cate and deliver data out of order. Building reliable abstractions on
> top of unreliable ones is a common pattern that we will encounter
> many times as we explore further how distributed systems work.
> Chapter3describes how to build a secure channel (TLS) on top of
> a reliable one (TCP), which provides encryption, authentication,
> and integrity.
> Chapter
> 4dives into how the phone book of the Internet (DNS)
> works, which allows nodes to discover others using names. At its

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, discovery, service discovery

---

> CHAPTER 20. MONITORING221
> A service dashboard displays service-specific implementation de-
> tails, which require a deep understanding of its inner workings.
> Unlike the previous dashboards, this one is primarily used by the
> team that owns the service.
> Beyond service-specific metrics, a service dashboard should also
> contain metrics for upstream dependencies like load balancers
> and messaging queues, and downstream dependencies like data
> stores.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, messaging, service mesh

---

> Contents
> Copyright6
> About the author7
> Acknowledgements8
> Preface9
> 0.1  Who should read this book. . . . . . . . . . . . . .10
> 1 Introduction11
> 1.1  Communication. . . . . . . . . . . . . . . . . . . .12
> 1.2  Coordination. . . . . . . . . . . . . . . . . . . . .13
> 1.3  Scalability. . . . . . . . . . . . . . . . . . . . . . .13
> 1.4  Resiliency. . . . . . . . . . . . . . . . . . . . . . .15
> 1.5  Operations. . . . . . . . . . . . . . . . . . . . . . .16

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, coordination, scalability, resiliency, operations

---

> altogether so that new requests can be sent to any process in the
> pool.
> 17.6 Watchdog
> One of the main reasons to build distributed services is to be able
> to withstand single-process failures. Since you are designing your
> system under the assumption that any process can crash at any
> time, your service needs to be able to deal with that eventuality.
> For a process’s crash to not affect your service’s health, you should
> ensure ideally that:
> 5

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, microservices, service mesh

---

> •test for behaviors, i.e., how the SUT handles a given input
> when it’s in a specific state.
> Anintegration testhas a larger scope than a unit test, since it ver-
> ifies that a service can interact with its external dependencies as
> expected. This definition is not universal, though, because inte-
> gration testing has different meanings for different people.
> Martin Fowler
> 2
> makes the distinction between narrow and broad
> integration tests. A narrow integration test exercises only the code

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh, continuous integration

---

> bring down the entire system with it. In practice, systems can have
> multiple single points of failure.
> A service that starts up by needing to read a configuration from a
> non-replicated database is an example of a single point of failure;
> if the database isn’t reachable, the service won’t be able to (re)start.
> A more subtle example is a service that exposes an HTTP API on
> top of TLS using a certificate that needs to be manually renewed.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, database systems, service mesh

---

> CHAPTER 1. INTRODUCTION13
> 1.2 Coordination
> Another hard challenge of building distributed systems is coordi-
> nating nodes into a single coherent whole in the presence of fail-
> ures. A fault is a component that stopped working, and a system is
> fault-tolerant when it can continue to operate despite one or more
> faults. The “two generals” problem is a famous thought experi-
> ment that showcases why this is a challenging problem.
> Suppose there are two generals (nodes), each commanding its own

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, coordination, fault-tolerant design

---

> like gRPC. In contrast, external APIs available to the public tend to
> be based on REST. In the rest of the chapter, we will walk through
> the process of creating a RESTful HTTP API.
> 5.1 HTTP
> HTTP
> 7
> is a request-response protocol used to encode and transport
> information between a client and a server. In anHTTP transaction,
> the client sends arequest messageto the server’s API endpoint, and
> the server replies back with aresponse message, as shown in Figure
> 5.2.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, request-response style, restful http

---

> 14
> 2PC standard, the search index
> doesn’t, which means we would have to implement that func-
> tionality from scratch. We also don’t want the catalog service to
> block if the search index is temporarily unavailable. Although
> we want the two data stores to be in sync, we can accept some
> temporary inconsistencies. In other words, eventual consistency
> is acceptable for our use case.
> To solve this problem, let’s introduce an message log in our appli-
> cation. A log
> 15

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, eventual consistency, service mesh

---

> is to start with “Windows Azure Storage: A Highly Available
> Cloud Storage Service with Strong Consistency
> 1
> ,” which de-
> scribes Azure’s cloud storage system
> 2
> . Azure’s cloud storage is
> the core building block on top of which Microsoft built many
> other successful products.  You will see many of the concepts
> introduced in the book there. One of the key design decisions
> was to guarantee strong consistency, unlike AWS S3
> 3
> , making the
> application developers’ job much easier.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, storage systems, service mesh

---

> immediately. As an open circuit breaker can have business im-
> plications, you need to think carefully what should happen when
> a downstream dependency is down. If the down-stream depen-
> dency is non-critical, you want your service to degrade gracefully,

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CONTENTS2
> 3.4  Handshake. . . . . . . . . . . . . . . . . . . . . .34
> 4 Discovery35
> 5 APIs39
> 5.1  HTTP. . . . . . . . . . . . . . . . . . . . . . . . .41
> 5.2  Resources. . . . . . . . . . . . . . . . . . . . . . .43
> 5.3  Request methods. . . . . . . . . . . . . . . . . . .45
> 5.4  Response status codes. . . . . . . . . . . . . . . .46
> 5.5  OpenAPI. . . . . . . . . . . . . . . . . . . . . . .48
> 5.6  Evolution. . . . . . . . . . . . . . . . . . . . . . .49
> II Coordination51
> 6 System models54

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** coordination, discovery, apis, http methods and status codes

---

> it downstream to their dependencies (see Figure12.4).
> Figure 12.4:
> 1. API client sends a request with credentials to API gateway
> 2. API gateway tries to authenticate credentials with auth service
> 3. Auth service validates credentials and replies with a security
> token
> 4. API gateway sends a request to service A including the security
> token
> 5. API gateway sends a request to service B including the security
> token
> 6. API gateway composes the responses from A and B and replies
> to the client

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, api gateway, service mesh

---

> than testing a monolith, testing the integration of all the microser-
> vices is an order of magnitude harder. Very subtle and unexpected

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** continuous integration

---

> purposes.
> To safely introduce a backward-incompatible change, it needs to
> bebrokendown into multiplebackward-compatiblechanges
> 6
> . For
> example, suppose the messaging schema between a producer and
> a consumer service needs to change in a backward incompatible
> way. In this case, the change is broken down into three smaller
> changes that can individually be rolled back safely:
> •In the prepare change, the consumer is modified to support
> 5

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, messaging, service mesh

---

> vice rather than the published SLO. To mitigate that, you can con-
> sider injecting controlled failures
> 12
> in production — also known as
> chaos testing — to “shake the tree” and ensure the dependencies
> can cope with the targeted service level and are not making un-
> realistic assumptions. As an added benefit, injecting faults helps
> validate that resiliency mechanisms work as expected.
> 11
> https://sre.google/sre-book/service-level-objectives/
> 12
> https://en.wikipedia.org/wiki/Chaos_engineering

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, service mesh

---

> other.
> As mentioned earlier, the size of the congestion window defines
> the maximum number of bytes that can be sent without receiving
> an acknowledgment. Because the sender needs to wait for a full
> roundtriptogetanacknowledgment, wecanderivethemaximum
> theoretical bandwidth by dividing the size of the congestion win-
> dow by the round trip time:
> 4
> https://en.wikipedia.org/wiki/CUBIC_TCP

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** congestion control, congestion window

---

> Chapter 4
> Discovery
> So far, we explored how to create a reliable and secure channel
> between two processes located on different machines. However,
> to create a new connection with a remote process, we still need to
> discover its IP address. To resolve hostnames into IP addresses, we
> can use the phone book of the Internet: theDomain Name System
> 1
> (DNS) — a distributed, hierarchical, and eventually consistent key-
> value store.
> In this chapter, we will look at how DNS resolution works in a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** discovery, name resolution, service discovery

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION115
> When an internal service receives a request with a security token
> attached to it, it needs to have a way to validate it and obtain the
> principal’s identity and its roles. The validation differs depending
> on the type of token used, which can be either opaque and not con-
> tain any information (e.g., an UUID), or be transparent and embed
> the principal’s information within the token itself.
> The downside of opaque tokens is that they require services to call

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, functional decomposition, service mesh

---

> CHAPTER 5. APIS41
> JavaScript and C#, can completely hide callbacks
> 3
> through
> language primitives such as async/await.  These primitives
> make writing asynchronous code as straightforward as writing a
> synchronous one.
> The most commonly used IPC technologies for request-response
> interactions are gRPC
> 4
> , REST
> 5
> , and GraphQL
> 6
> . Typically, internal
> APIs used for service-to-service communications within an organi-
> zation are implemented with a high-performance RPC framework

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, apis, request-response style

---

> stateless service, as long as you have considered the impact on
> the service’s dependencies. Scaling out a stateful service is signifi-
> cantly more challenging as some form of coordination is required.
> Section14.1introduces the concept of load balancing requests
> across nodes and its implementation using commodity machines.
> We will start with DNS load balancing and then dive into the
> implementation of load balancers that operate at the transport and

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** coordination, microservices, service mesh

---

> consumers again when the timeout triggers. When the con-
> sumer is done processing the message, it deletes it from the
> channel preventing it from being received by any other con-
> sumer in the future.
> The above guarantees are very similar to what cloud services such
> as Amazon’s SQS
> 18
> and Azure Storage Queues
> 19
> offer.
> 12.4.2 Exactly-once processing
> As mentioned, a consumer has to delete a message from the chan-
> nel once it’s done processing it so that it won’t be read by another
> consumer.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, storage systems, stream processing

---

> assigned to.
> Consequently, a heavy or poisonous user can only degrade the re-
> quests of users within the same partition. For example, suppose
> there are 10 instances of a service behind a load balancer, which are
> divided into 5 partitions (see Figure17.6). In that case, a problem-
> atic user can only ever impact 20 percent of the service’s instances.
> The problem is that the unlucky users who happen to be on the
> same partition as the problematic one are fully impacted. Can we
> do better?

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, range partitioning, service mesh

---

> CHAPTER 21. OBSERVABILITY231
> in a network call (through HTTP headers, for example). Each stage
> is represented with a span — an event containing the trace id.
> When a span ends, it’s emitted to a collector service, which assem-
> bles it into a trace by stitching it together with the other spans be-
> longing to the same trace. Popular distributed tracing collectors
> include Open Zipkin
> 3
> and AWS X-ray
> 4
> .
> Tracing is challenging to retrofit into an existing system as it re-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, distributed tracing and spans

---

> a spike of requests. The same can happen at run-time if a specific
> data item that wasn’t accessed before becomes all of a sudden very
> popular.
> Request coalescing can be used to reduce the impact of a thunder-
> ing herd. The idea is that there should be at most one outstanding
> request at the time to fetch a specific data item per in-process cache.
> For example, if a service instance is serving 10 concurrent requests
> requiring a specific record that is not yet in the cache, the instance

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, request coalescing, service mesh

---

> 12.2. The APIs decouple the
> services from each other by creating boundaries that are hard to
> violate, unlike the ones between components running in the same
> process.
> This architectural style is also referred to as themicroservice archi-
> tecture. The termmicrocan be misleading, though — there doesn’t
> havetobeanythingmicroabouttheservices. Infact, Iwouldargue
> that if a service doesn’t do much, it just creates more operational
> overhead than benefits. A more appropriate name for this architec-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, service mesh

---

> service is doing 10 million requests per day, then by the end of the
> day you lose 100 GB of memory! Eventually, the servers won’t
> have enough memory available and they will start to trash due to
> the constant swapping of pages in and out from disk.
> Thisnastybehavioriscausedbycruelmath; givenanoperationthat
> has a certain probability of failing, the total number of failures in-
> creases with the total number of operations performed. In other

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, microservices, service mesh

---

> CONTENTS4
> 14.2 Replication. . . . . . . . . . . . . . . . . . . . . .145
> 14.2.1 Single leader replication. . . . . . . . . . .145
> 14.2.2 Multi-leader replication. . . . . . . . . . .148
> 14.2.3 Leaderless replication. . . . . . . . . . . . .150
> 14.3 Caching. . . . . . . . . . . . . . . . . . . . . . . .152
> 14.3.1 Policies. . . . . . . . . . . . . . . . . . . .152
> 14.3.2 In-process cache. . . . . . . . . . . . . . . .153
> 14.3.3 Out-of-process cache. . . . . . . . . . . . .154
> IV Resiliency157

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, replication, multi-leader replication, leaderless replication

---

> CHAPTER 5. APIS46
> •POST /products— Create a new product and return the URI
> of the new resource.
> •GET /products— Retrieve a list of products. The query string
> can be used to filter, paginate, and sort the collection. Pagina-
> tion should be used to return a limited number of resources
> per call to prevent denial of service attacks.
> •GET /products/42— Retrieve product 42.
> •PUT /products/42— Update product 42.
> •DELETE /products/42— Delete product 42.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, service mesh

---

> CHAPTER 5. APIS48
> 5.5 OpenAPI
> Now that we have learned how to map the operations defined by
> our service’s interface onto RESTful HTTP endpoints, we can for-
> mally define the API with aninterface definition language(IDL), a
> language independent description of it. The IDL definition can be
> used to generate boilerplate code for the IPC adapter and client
> SDKs in your languages of choice.
> The OpenAPI
> 13
> specification, which evolved from the Swagger

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, apis, restful http

---

> tion style referred to asmessaging. In this model, the sender and
> the receiver don’t communicate directly with each other; they ex-
> change messages through a channel that acts as a broker. The
> sender sends messages to the channel, and on the other side, the
> receiver reads messages from it.
> A message channel acts as a temporary buffer for the receiver. Un-
> likethedirectrequest-responsecommunicationstylewehavebeen
> using so far, messaging is inherently asynchronous as sending a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, request-response style, messaging

---

> and fail fast in all the other ones.
> 16.3 Circuit breaker
> Suppose your service uses timeouts to detect communication fail-
> ures with a downstream dependency, and retries to mitigate tran-
> sient failures. If the failures aren’t transient and the downstream
> dependency keeps being unresponsive, what should it do then?
> If the service keeps retrying failed requests, it will necessarily be-
> come slower for its clients. In turn, this slowness can propagate to

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, microservices, service mesh

---

> message doesn’t require the receiving service to be online.
> A message has a well-defined format, consisting of a header and
> a body. The message header contains metadata, such as a unique
> message ID, while its body contains the actual content. Typically, a
> message can either be a command, which specifies an operation to
> be invoked by the receiver, or an event, which signals the receiver
> that something of interest happened in the sender.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, microservices, service mesh

---

> system fails, increasing the probability that other portions fail.
> For example, suppose there are multiple clients querying two
> database replicas A and B, which are behind a load balancer. Each
> replica is handling about 50 transactions per second (see Figure
> 15.1).
> Figure 15.1:Two replicas behind an LB; each is handling half the
> load.
> Suddenly, replica B becomes unavailable because of a network
> fault. The load balancer detects that B is unavailable and removes

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** replication, transactions, database systems

---

> component can fail by considering the likelihood of it happening
> and its resulting impact when it does. If the risk is high, you will
> need to mitigate it. Part 4 of the book is dedicated to fault tolerance
> and it introduces various resiliency patterns, such as rate limiting
> and circuit breakers.
> 1.5 Operations
> Distributed systems need to be tested, deployed, and maintained.
> It used to be that one team developed an application, and another

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, resiliency, operations

---

> CHAPTER 11. TRANSACTIONS84
> known as ACID:
> •Atomicity guarantees that partial failures aren’t possible; ei-
> ther all the operations in the transactions complete success-
> fully, or they are rolled back as if they never happened.
> •Consistency guarantees that the application-level invariants,
> like a column that can’t be null, must always be true. Con-
> fusingly, the “C” in ACID has nothing to do with the con-
> sistency models we talked about so far, and according to

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, consistency models, transactions

---

> CHAPTER 16. DOWNSTREAM RESILIENCY175
> rather than to stop entirely.
> Think of an airplane that loses one of its non-critical sub-systems
> in flight; it shouldn’t crash, but rather gracefully degrade to a state
> where the plane can still fly and land. Another example is Ama-
> zon’s front page; if the recommendation service is not available,
> the page should render without recommendations. It’s a better
> outcome than to fail the rendering of the whole page entirely.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, service mesh

---

> CHAPTER 11. TRANSACTIONS89
> 11.3.1 Two-phase commit
> Two-phase commit
> 9
> (2PC) is a protocol used to implement atomic
> transaction commits across multiple processes. The protocol is
> split into two phases,prepareandcommit. It assumes a process acts
> ascoordinatorand orchestrates the actions of the other processes,
> calledparticipants. Generally, the client application that initiates
> the transaction acts as the coordinator for the protocol.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transactions, two-phase commit (2pc)

---

> update the same bucket concurrently, which would result in a lost
> update. To avoid any race conditions, the fetch, update, and write
> operations need to be packaged into a single transaction.
> Although this approach is functionally correct, it’s costly. There
> are two issues here: transactions are slow, and executing one per
> request would be crazy expensive as the database would have to
> scale linearly with the number of requests. On top of that, for each

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, transactions, database systems

---

> commonplace for the development team to also be responsible for
> testing and operating the software they write. This forces the de-
> velopers to embrace an end-to-end view of their applications, ac-
> knowledging that faults are inevitable and need to be accounted
> for.
> Chapter18describesthedifferenttypesoftests—unit, integration,
> andend-to-endtests— youcanleveragetoincreasetheconfidence
> that your distributed applications work as expected.
> Chapter19dives into continuous delivery and deployment

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, continuous integration

---

> pipelines used to release changes safely and efficiently to produc-
> tion.
> Chapter
> 20discusses how to use metrics and service-level indica-
> tors to monitor the health of distributed systems. It then describes
> how to define objectives that trigger alerts when breached. Finally,
> the chapter lists best practices for dashboard design.
> Chapter
> 21introduces the concept of observability and how it re-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, observability engineering

---

> CHAPTER 11. TRANSACTIONS96
> In our example, the travel booking service is the transaction’s co-
> ordinator, while the flight and hotel booking services are the trans-
> action’s participants. The Saga is composed of three local transac-
> tions:푇
> 1
> books a flight,푇
> 2
> books a hotel, and퐶
> 1
> cancels the flight
> booked with푇
> 1
> .
> At a high level, the Saga can be implemented with theworkflow
> 19
> depicted in Figure11.5:
> 1.The coordinator initiates the transaction by sending a book-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, service mesh

---

> CHAPTER 13. PARTITIONING134
> 13.2.3 Practical considerations
> Introducing partitions in the system adds a fair amount of com-
> plexity, even if it appears deceptively simple. Partition imbalance
> can easily become a headache as a single hot partition can bottle-
> neck the system and limit its ability to scale. And as each partition
> is independent of the others, transactions are required to update
> multiple partitions atomically.
> We have merely scratched the surface on the topic; if you are in-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, transactions, range partitioning

---

> CHAPTER 5. APIS44
> by invoking the methods defined in the service interface and con-
> verts their return values into HTTP responses. But to perform this
> mapping, we first need to understand how to model the API with
> HTTP in the first place.
> An HTTP server hosts resources. Aresourceis an abstraction of
> information, like a document, an image, or a collection of other
> resources. It’s identified by a URL, which describes the location of
> the resource on the server.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, service mesh

---

> Chapter 16
> Downstream resiliency
> In this chapter, we will explore patterns that shield a service
> against failures in its downstream dependencies.
> 16.1 Timeout
> When you make a network call, you can configure a timeout to fail
> the request if there is no response within a certain amount of time.
> If you make the call without setting a timeout, you tell your code
> that you are 100% confident that the call will succeed. Would you
> really take that bet?

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, service mesh

---

> in transactional stores that can handle high-dimensional data well,
> but struggle with high throughput. Metrics are mainly used for
> monitoring, while event logs and traces mainly for debugging.
> Observability is a superset of monitoring. While monitoring is fo-
> cused exclusively on tracking the health of a system, observability
> also provides tools to understand and debug it. Monitoring on its
> own is good at detecting failure symptoms, but less so to explain
> their root cause (see Figure21.1).

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** monitoring and observability, observability engineering

---

> CHAPTER 5. APIS43
> going requests is by creating multiple connections. Although it
> comes with a price because connections consume resources like
> memory and sockets.
> HTTP 2
> 9
> was designed from the ground up to address the main
> limitations of HTTP 1.1. It uses a binary protocol rather than a tex-
> tual one, which allows HTTP 2 to multiplex multiple concurrent
> request-response transactions on the same connection. In early
> 2020 about half of the most-visited websites on the Internet were

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, request-response style, transactions

---

> CHAPTER 20. MONITORING219
> While you should define most of your alerts based on SLOs, some
> should trigger for known hard-failure modes that you haven’t had
> thetimetodesignordebugaway. Forexample, supposeyouknow
> your service suffers from a memory leak that has led to an incident
> in the past, but you haven’t managed yet to track down the root-
> cause or build a resiliency mechanism to mitigate it. In this case, it
> could be useful to define an alert that triggers an automated restart

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION110
> 12.2 API gateway
> After you have split an application into a set of services, each with
> its own API, you need to rethink how clients communicate with
> the application. A client might need to perform multiple requests
> todifferentservicestofetchalltheinformationitneedstocomplete
> a specific operation. This can be very expensive on mobile devices
> where every network request consumes precious battery life.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** functional decomposition, api gateway

---

> ing request to the flight service (푇
> 1
> ). If the booking fails, no
> harm is done, and the coordinator marks the transaction as
> aborted.
> 2.If the flight booking succeeds, the coordinator sends a book-
> ing request to the hotel service (푇
> 2
> ). If the request succeeds,
> the transaction is marked as successful, and we are all done.
> 3.If the hotel booking fails, the transaction needs to be aborted.
> The coordinator sends a cancellation request to the flight ser-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, service mesh

---

> CHAPTER 5. APIS42
> Figure 5.2:An example HTTP transaction between a browser and
> a web server.
> TCP for the reliability guarantees discussed in chapter2. When it
> rides on top of TLS, it’s also referred to as HTTPS. Needless to say,
> you should use HTTPS by default.
> HTTP 1.1 keeps a connection to a server open by default to avoid
> creating a new one when the next transaction occurs. Unfortu-
> nately, a new request can’t be issued until the response of the pre-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** tcp reliability, apis, transactions

---

> when clients don’t expect a response within a short time frame.
> The idea is to introduce a messaging channel between the clients
> and the service. The channel decouples the load directed to the
> service from its capacity, allowing the service to process requests
> at its own pace — rather than requests being pushed to the service
> by the clients, they are pulled by the service from the channel. This
> pattern is referred to as load leveling and it’s well suited to fend

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, messaging, service mesh

---

> small fraction of requests having a high response time? If 100 re-
> quests per second take 20 seconds to process, then 2K additional
> threads are needed to deal just with the slow requests. So the num-
> ber of threads used by the service needs to double to keep up with
> the load!
> Measuring long-tail behavior and keeping it under check doesn’t
> just make your users happy, but also drastically improves the re-
> siliency of your service and reduces operational costs. When you

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, microservices, service mesh

---

> cause of that, when a developer needs to change a part of
> the backend, they only need to understand a small part of
> the whole.
> •Each service can be scaled independently and adopt a differ-
> ent technology stack based on its own needs. The consumers
> of the APIs don’t care how the functionality is implemented
> after all. This makes it easy to experiment and evaluate new
> technologies without affecting other parts of the system.
> •Each microservice can have its own independent data model

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, apis, service mesh

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION127
> Of course, the downside is that you lose the ability to transac-
> tionally update the blob with its metadata and potentially other
> records in the data store. For example, suppose a transaction
> inserts a new record in the data store containing an image. In this
> case, the image won’t be visible until the transaction completes;
> that won’t be the case if the image is stored in an external store,
> though.  Similarly, if the record is later deleted, the image is

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, functional decomposition, transactions

---

> nition, we can then run a tool to generate the API’s documentation,
> boilerplate adapters, and client SDKs for our languages of choice.
> 5.6 Evolution
> APIs start out as beautifully-designed interfaces.  Slowly, but
> surely, they will need to change over time to adapt to new use
> cases. The last thing you want to do when evolving your API is
> to introduce a breaking change that requires modifying all the
> clients in unison, some of which you might have no control over

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, api design and evolution

---

> demand. One way to implement dynamic partitioning is to start
> with a single partition. When it grows above a certain size or be-
> comes too hot, it’s split into two sub-partitions, each containing
> approximately half of the data. Then, one sub-partition is trans-
> ferred to a new node. Similarly, if two adjacent partitions become
> small enough, they can be merged into a single one.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** range partitioning, hash partitioning

---

> all actions taken by the operator should be communicated into a
> shared channel like a global chat, that’s accessible by other teams.
> This allows others to chime in, track the incident’s progress, and
> make it easier to hand over an ongoing incident to someone else.
> The first step to address an alert is to mitigate it, not fix the under-
> lying root cause that created it. A new artifact has been rolled out
> that degrades the service? Roll it back. The service can’t cope with

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, transactions, service mesh

---

> cess can batch bucket updates in memory for some time, and flush
> them asynchronously to the database at the end of it (see Figure
> 4
> https://en.wikipedia.org/wiki/Compare-and-swap

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** database systems

---

> line.
> While it’s possible to take an unreliable communication link and
> convert it into a more reliable one using a protocol (e.g., keep re-
> transmitting lost messages), the equivalent isn’t possible for nodes.
> Because of that, algorithms for different node models look very dif-
> ferent from each other.
> Byzantine node models are typically used to model safety-critical
> systems like airplane engine systems, nuclear power plants, finan-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, reliable link model

---

> CHAPTER 10. REPLICATION78
> Figure 10.4:The side-effects of a strongly consistent operation are
> visible to all observers once it completes.
> tency model calledlinearizability
> 4
> , or strong consistency. Lineariz-
> ability is the strongest consistency guarantee a system can provide
> for single-object requests.
> What if the client sends a read request to the leader and by the
> time the request gets there, the server assumes it’s the leader, but

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, operations, replication

---

> The implementation of rate-limiting is interesting in its own right,
> and it’s well worth spending some time studying it, as a similar ap-
> proach can be applied to other use cases. We will start with single-
> process implementation first and then proceed with a distributed
> one.
> Suppose we want to enforce a quota of 2 requests per minute, per
> API key. A naive approach would be to use a doubly-linked list
> per API key, where each list stores the timestamps of the last N

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, rate-limiting and throttling

---

> that can
> compare the IDL specifications of your API and check for break-
> ing changes; use them in your continuous integration pipelines.
> 14
> https://martin.kleppmann.com/2012/12/05/schema-evolution-in-avro-
> protocol-buffers-thrift.html
> 15
> https://github.com/Azure/openapi-diff

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** continuous integration

---

> Figure 14.3:A L7 LB is typically used as the backend of a L4 one
> to load balance requests sent by external clients from the internet.
> A drawback of using a dedicated load-balancing service is that all
> the traffic needs to go through it and if the LB goes down, the ser-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 17. UPSTREAM RESILIENCY185
> tem and degrade every other client. We have seen some patterns,
> like rate-limiting, that help prevent a single client from using more
> resources than it should. But rate-limiting is not bulletproof. You
> can rate-limit clients based on the number of requests per second;
> but what if a client sends very heavy or poisonous requests that
> cause the servers to degrade? In that case, rate-limiting wouldn’t

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, rate-limiting and throttling

---

> •debug rare issues that affect only an extremely small fraction
> of requests;
> •debug issues that affect a large fraction of requests, like high
> response times for requests that hit a specific subset of ser-
> vice instances;
> •Identify bottlenecks in the end-to-end request path;
> •Identify which clients hit which downstream services and
> in what proportion (also referred to as resource attribution),
> which can be used for rate-limiting or billing purposes.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, rate-limiting and throttling

---

> CHAPTER 21. OBSERVABILITY227
> Figure 21.1:Observability is a superset of monitoring.
> }
> Logs can originate from your services and external dependencies,
> like message brokers, proxies, databases, etc. Most languages offer
> libraries that make it easy to emit structured logs. Logs are typi-
> cally dumped to disk files, which are rotated every so often, and
> forwarded by an agent to an external log collector asynchronously,
> like an ELK stack
> 1
> or AWS CloudWatch logs.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, monitoring and observability

---

> and respond promptly. Messaging — a form of indirect communi-
> cation — doesn’t have this requirement, though.
> Messaging was first introduced when we discussed the implemen-
> tation of asynchronous transactions in section
> 11.4.1. It is a form
> of indirect communication in which a producer writes a message
> to a channel — or message broker — that delivers the message to
> a consumer on the other end.
> By decoupling the producer from the consumer, the former gains

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, messaging, transactions

---

> CHAPTER 12. FUNCTIONAL DECOMPOSITION126
> If messages belong to different users
> 22
> and are decorated with
> some kind of identifier, consumers can decide to treat “noisy”
> users differently. For example, suppose messages from a specific
> user fail consistently. In that case, the consumers could decide
> to write these messages to an alternate low-priority channel and
> remove them from the main channel without processing them.
> The consumers can continue to read from the slow channel, but

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** functional decomposition, stream processing

---

> lower the round trip time (RTT) is, the quicker the sender can
> start utilizing the underlying network’s bandwidth, as shown in
> Figure2.4.
> What happens if a segment is lost? When the sender detects a
> missed acknowledgment through a timeout, a mechanism called
> congestion avoidancekicks in, and the congestion window size is
> reduced. From there onwards, the passing of time increases the
> window size
> 4
> by a certain amount, and timeouts decrease it by an-
> other.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** congestion control, congestion window

---

> CHAPTER 3. SECURE LINKS33
> by scanning the certificate chain until a certificate is found that it
> trusts. Then the certificates are verified in the reverse order from
> that point in the chain. The verification checks several things, like
> the certificate’s expiration date and whether the digital signature
> was actually signed by the issuing CA. If the verification reaches
> the last certificate in the path without errors, the path is verified,
> and the server is authenticated.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** digital certificates, formal verification

---

> Suppose we are responsible for implementing a service to man-
> age the product catalog of an e-commerce application. The service
> must allow users to browse the catalog and admins to create, up-
> date, or delete products. Sounds simple enough; the interface of
> the service could be defined like this:
> interfaceCatalogService
> {
> List<Product>GetProducts(...);
> ProductGetProduct(...);
> voidAddProduct(...);
> voidDeleteProduct(...);
> voidUpdateProduct(...)
> }

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 3. SECURE LINKS34
> 3.4 Handshake
> When a new TLS connection is established, a handshake between
> the client and server occurs during which:
> 1.The parties agree on the cipher suite to use. A cipher suite
> specifies the different algorithms that the client and the
> server intend to use to create a secure channel, like the:
> •key exchange algorithm used to generate shared
> secrets;
> •signature algorithm used to sign certificates;
> •symmetric encryption algorithm used to encrypt the ap-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** key exchange, tls handshake

---

> an end-to-end test that runs in production and uses live services
> rather than test doubles.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices

---

> percent.
> Also, long-tail behaviors left unchecked can quickly bring a ser-
> 7
> https://igor.io/latency/
> 8
> This tends to be primarily caused by various queues in the request-response
> path.
> 9
> https://www.akamai.com/uk/en/about/news/press/2017-press/akamai-
> releases-spring-2017-state-of-online-retail-performance-report.jsp

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** request-response style

---

> CHAPTER 2. RELIABLE LINKS24
> 2.2 Connection lifecycle
> A connection needs to be opened before any data can be transmit-
> ted on a TCP channel. The state of the connection is managed by
> the operating system on both ends through asocket. The socket
> keeps track of the state changes of the connection during its life-
> time. At a high level, there are three states the connection can be
> in:
> •The opening state, in which the connection is being created.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** reliable links, connection lifecycle

---

> Splitting the key-range evenly doesn’t make much sense though if
> the distribution of keys is not uniform, like in the English dictio-
> nary. Doing so creates unbalanced partitions that contain signifi-
> cantly more entries than others.
> Another issue with range partitioning is that some access patterns
> can lead to hotspots. For example, if a dataset is range partitioned
> by date, all writes for the current day end up in the same partition,
> which degrades the data store’s performance.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** range partitioning, hash partitioning

---

> •The established state, in which the connection is open and
> data is being transferred.
> •The closing state, in which the connection is being closed.
> This is a simplification, though, as there are more states
> 2
> than the
> three above.
> A server must be listening for connection requests from clients be-
> fore a connection is established. TCP uses a three-way handshake
> to create a new connection, as shown in Figure
> 2.1:
> 1.The sender picks a random sequence numberxand sends a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** three-way handshake, tls handshake

---

> CHAPTER 13. PARTITIONING129
> the first place? At a high level, there are two ways to implement
> the mapping using either range partitioning or hash partitioning.
> 13.1.1 Range partitioning
> With range partitioning, the data is split into partitions by key
> range in lexicographical order, and each partition holds a continu-
> ous range of keys, as shown in Figure13.1. The data can be stored
> in sorted order on disk within each partition, making range scans
> fast.
> Figure 13.1:A range partitioned dataset

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** range partitioning, hash partitioning

---

> CHAPTER 13. PARTITIONING132
> Now, when a new partition is added, only the keys mapped to it
> need to be reassigned, as shown in Figure13.4.
> Figure 13.4:After partition P4 is added, key ’for’ is reassigned to
> P4, but the other keys are not reassigned.
> The main drawback of hash partitioning compared to range parti-
> tioning is that the sort order over the partitions is lost. However,
> the data within an individual partition can still be sorted based on
> a secondary key.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** range partitioning, hash partitioning

---

> retrying immediately will only make matters worse. This is why
> retrying needs to be slowed down with increasingly longer delays
> between the individual retries until either a maximum number of
> retries is reached or a certain amount of time has passed since the
> initial request.
> 9
> We talked about this in section14.1.3when discussing the sidecar pattern and
> the service mesh.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 20. MONITORING222
> dashboard. For example, a 1-hour range with a 1-min resolution
> is best to monitor an ongoing incident, while a 1-year range with
> a 1-day resolution is best for capacity planning.
> You should keep the number of data points and metrics on the
> same chart to a minimum. Rendering too many points doesn’t just
> slow downloading charts, but also makes them hard to interpret
> and spot anomalies.
> A chart should contain only metrics with similar ranges (min and

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** name resolution, capacity planning

---

> its the maximum size of the congestion window. The smaller the
> congestion window is, the fewer bytes can be in-flight at any given
> time, and the less bandwidth is utilized.
> When a new connection is established, the size of the congestion
> window is set to a system default.  Then, for every segment
> acknowledged, the window increases its size exponentially
> until reaching an upper limit. This means that we can’t use the
> network’s full capacity right after a connection is established. The

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** congestion control, congestion window

---

> CHAPTER 8. TIME63
> didn’t happen-before C, even if their timestamps seem to imply
> it. To guarantee the converse relationship, we will have to use a
> different type of logical clock: thevector clock.
> 8.3 Vector clocks
> Avector clock
> 6
> is a logical clock that guarantees that if two opera-
> tions can be ordered by their logical timestamps, then one must
> have happened-before the other. A vector clock is implemented
> with an array of counters, one for each process in the system. And

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** vector clocks, happened-before relation

---

> in chapter
> 7, there are several reasons why the client hasn’t re-
> ceived a response so far:
> •the server is slow;
> •the client’s request has been dropped by a network switch,
> router or proxy;
> •the server has crashed while processing the request;
> •or the server’s response has been dropped by a network
> switch, router or proxy.
> Slow network calls are the silent killers
> 1
> of distributed systems. Be-
> cause the client doesn’t know whether the response is on its way or

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, stream processing

---

> how distributed transactions differ from ACID transactions and
> how you can implement them in your systems. We will focus our
> attention mainly on atomicity and isolation.
> 11.2 Isolation
> A set of concurrently running transactions that access the same
> data can run into all sorts of race conditions, like dirty writes, dirty
> reads, fuzzy reads, and phantom reads:
> 1
> http://www.bailis.org/blog/when-is-acid-acid-rarely/
> 2
> https://www.postgresql.org/docs/9.1/wal-intro.html

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, transactions

---

> disruption to the data store, which needs to continue to serve re-
> quests. Hence, the amount of data transferred during the rebalanc-
> ing act needs to be minimized.
> 13.2.1 Static partitioning
> Here, the idea is to create way more partitions than necessary
> when the data store is first initialized and assign multiple parti-
> tions per node. When a new node joins, some partitions move
> from the existing nodes to the new one so that the store is always
> in a balanced state.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** range partitioning, hash partitioning

---

> longercutsit, asthequotaneedstobeenforcedonthetotalnumber
> of requests per API key across all service instances. This requires
> a shared data store to keep track of the number of requests seen.
> As discussed earlier, we need to store two integers per API key,
> one for each bucket. When a new request comes in, the process
> receivingitcouldfetchthebucket, updateitandwriteitbacktothe
> data store. But, that wouldn’t work because two processes could

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> Before considering the use of a leader, check whether there are
> other ways of achieving the desired functionality without it. For
> example, optimistic locking is one way to guarantee mutual ex-
> clusion at the cost of wasting some computing power. Or per-
> haps high availability is not a requirement for your application, in
> which case having just a single process that occasionally crashes
> and restarts is not a big deal.
> As a rule of thumb, if you must use leader election, you have to

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** cloud computing, edge computing

---

> CHAPTER 1. INTRODUCTION14
> request and its response.
> Loadcanbemeasuredindifferentwayssinceit’sspecifictothesys-
> tem’s use cases. For example, number of concurrent users, number
> of communication links, or ratio of writes to reads are all different
> forms of load.
> As the load increases, it will eventually reach the system’scapac-
> ity— the maximum load the system can withstand. At that point,
> the system’s performance either plateaus or worsens, as shown in

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, performance engineering

---

> need isolation in the first place. Suppose we were to drop the iso-
> lation requirement and the assumption that the transactions are
> short-lived. Can we come up with an asynchronous non-blocking
> solution that still provides atomicity?
> 11.4.1 Log-based transactions
> A typical pattern
> 13
> in modern applications is replicating the same
> data in different data stores tailored to different use cases, like
> 12
> https://static.googleusercontent.com/media/research.google.com/en//arc
> hive/spanner-osdi2012.pdf

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** log-based transactions, transactions

---

> CHAPTER 14. DUPLICATION150
> flict resolution procedure, which can be executed by the data
> store whenever a conflict is detected.
> •Finally, the data store could leverage data structures that pro-
> vide automatic conflict resolution, like aconflict-free replicated
> data type(CRDT). CRDTs
> 12
> are data structures that can be
> replicated across multiple nodes, allowing each replica to up-
> dateitslocalversionindependentlyfrom otherswhileresolv-
> ing inconsistencies in a mathematically sound way.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** name resolution, replication

---

> CHAPTER 14. DUPLICATION154
> different version of the same entry. Additionally, an entry needs
> to be fetched once per cache, creating downstream pressure pro-
> portional to the number of clients.
> This issue is exacerbated when a service with an in-process cache is
> restartedorscalesout, andeverynewlystartedinstancerequiresto
> fetch entries directly from the dependency. This can cause a “thun-
> dering herd” effect where the downstream dependency is hit with

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> — rather than storing a blob in a database directly, you only store
> some metadata containing an external reference to the actual blob.
> The advantage of this solution is that it minimizes data being trans-
> ferred back and forth to and from the data store, improving its per-
> formance while reducing the required bandwidth. Also, the cost
> per byte of an object store designed to persist large objects that in-
> frequently change, if at all, is lower than the one of a generic data
> store.
> 22

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** database systems, performance engineering

---

> messageto the service, and the service replies back with aresponse
> message. This is similar to a function call, but across process bound-
> aries and over the network.
> The request and response messages contain data that is serialized
> in a language-agnostic format. The format impacts a message’s
> serialization and deserialization speed, whether it’s human-
> readable, and how hard it is to evolve it over time. Atextual

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> The alternative to scaling up isscaling outby distributing the load
> over multiple nodes. This part explores 3 categories — or dimen-
> sions — of scalability patterns:functional decomposition,partition-
> ing, andduplication. Thebeautyofthesedimensionsisthattheyare
> independent of each other and can be combined within the same
> application.
> Functional decomposition
> Functional decomposition is the process of taking an application
> and breaking it down into individual parts. Think of the last time

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** scalability, functional decomposition

---

> Aservice-level indicator(SLI) is a metric that measures one aspect
> of thelevel of serviceprovided by a service to its users, like the re-
> sponse time, error rate, or throughput. SLIs are typically aggre-
> gatedoverarollingtimewindowandrepresentedwithasummary
> statistic, like average or percentile.
> SLIs are best defined with a ratio of two metrics, good events over
> total number of events, since they are easy to interpret: 0 means
> 6
> https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/clo

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 18. TESTING196
> Figure 18.1:Test pyramid
> 18.2 Size
> The size of a test
> 3
> reflects how much computing resources it needs
> to run, like the number of nodes. Generally, that depends on
> how realistic the environment is where the test runs. Although
> the scope and size of a test tend to be correlated, they are distinct
> concepts, and it helps to separate them.
> Asmall testruns in a single process and doesn’t perform any block-
> ing calls or I/O. It’s very fast, deterministic, and has a very small

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** cloud computing, edge computing

---

> for is one of the largest in the world. It processes millions of events
> per second from billions of devices worldwide.
> Before that, I worked at Mozilla, where I set the direction of the
> data platform from its very early days and built a large part of it,
> including the team.
> After getting my master’s degree in computer science, I worked
> on scientific computing applications at the Berkeley Lab. The soft-
> ware I contributed is used to this day by the ATLAS experiment at
> the Large Hadron Collider.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** cloud computing, edge computing

---

> CHAPTER 11. TRANSACTIONS88
> plemented withmulti-version concurrency control
> 7
> (MVCC). With
> MVCC, the data store keeps multiple versions of a data item. Read-
> only transactions aren’t blocked by other transactions, as they can
> keepreadingtheversionofthedatathatwascommittedatthetime
> the transaction started. But, a transaction that writes to the store is
> aborted or restarted when a conflict is detected. While MVCC per
> se doesn’t guarantee serializability, there are variations of it that

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transactions, concurrency theory

---

> When a producer writes a message to the request channel, it dec-
> orates it with a request id and a reference to its response channel.
> After a consumer has read and processed the message, it writes
> a reply to the producer’s response channel, tagging it with the re-
> quest’s id, which allows the producer to identify the request it be-
> longs to.
> Figure 12.7:Request-response messaging style

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** request-response style, messaging

---

> Logs provide a wealth of information about everything that’s hap-
> pening in a service. They are particularly helpful for debugging
> purposes, astheyallowustotracebacktherootcausefromasymp-
> tom, like a service instance crash. They also help to investigate
> long-tail behaviors that are missed by metrics represented with
> averages and percentiles, which can’t help explain why a specific
> user request is failing.
> Logs are very simple to emit, particularly free-form textual ones.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> application blocks completely. The assumption is that the coordi-
> nator and the participants are available and that the duration of
> the transaction is short-lived. Because of its blocking nature, 2PC
> is generally combined with a blocking concurrency control mech-
> anism, like 2PL, to provide isolation.
> But, some types of transactions can take hours to execute, in which
> case blocking just isn’t an option. And some transactions don’t

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transactions, concurrency theory

---

> You should also not retry a network call that isn’t idempotent, and
> whose side effects can affect your application’s correctness. Sup-
> pose a process is making a call to a payment provider service, and
> the call times out; should it retry or not? The operation might have
> succeededandretryingwouldchargetheaccounttwice, unlessthe
> request is idempotent.
> 16.2.2 Retry amplification
> Suppose that handling a request from a client requires it to go

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, retry amplification

---

> Of course, you can always opt to create in-memory aggregates
> from the measurements collected in events (e.g., metrics) and emit
> just those rather than raw logs. By doing so, you trade-off the abil-
> ity to drill down into the aggregates if needed.
> 21.2 Traces
> Tracing captures the entire lifespan of a request as it propagates
> throughout the services of a distributed system. Atraceis a list
> 2
> https://www.honeycomb.io/blog/dynamic-sampling-by-example/

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, microservices

---

> Pings and heartbeats are typically used when specific processes
> frequently interact with each other, and an action needs to be taken
> as soon as one of them is no longer reachable. If that’s not the case,
> detecting failures just at communication time is good enough.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** communication, transactions

---

> CHAPTER 14. DUPLICATION143
> vice behind it is no longer reachable. Additionally, it’s one more
> service that needs to be operated and scaled out.
> Whentheclientsareinternaltoanorganization, theL7LBfunction-
> ality can alternatively be bolted onto the clients directly using the
> sidecar pattern. In this pattern, all network traffic from a client goes
> through a process co-located on the same machine. This process
> implements load balancing, rate-limiting, authentication, monitor-
> ing, and other goodies.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> can be identified, giving the system a kind of self-healing property.
> Imagine that a latent memory leak causes the available memory to
> decrease over time. When a process doesn’t have more physical
> memory available, it starts to swap back and forth to the page file
> on disk. This swapping is extremely expensive and degrades the
> process’sperformancedramatically. Ifleftunchecked, thememory
> leak would eventually bring all processes running the service on

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 2. RELIABLE LINKS26
> Figure 2.2:The receive buffer stores data that hasn’t been pro-
> cessed yet by the application.
> Figure 2.3:The size of the receive buffer is communicated in the
> headers of acknowledgments segments.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** reliable links

---

> If it sounds like a L7 LB has some overlapping functionality with
> 8
> Also referred to as a layer 7 (L7) load balancer since layer 7 is the application
> layer in the OSI model

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** application layer

---

> do, like Serializable Snapshot Isolation
> 8
> (SSI).
> Optimistic concurrency makes sense when you have read-heavy
> workloads that only occasionally perform writes, as reads don’t
> need to take any locks. For write-heavy loads, a pessimistic pro-
> tocol is more efficient as it avoids retrying the same transactions
> repeatedly.
> I have deliberately not spent much time describing 2PL and
> MVCC, as it’s unlikely you will have to implement them in your

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transactions, concurrency theory

---

> vice to cancel the flight it previously booked (퐶
> 1
> ). Without
> the cancellation, the transaction would be left in an inconsis-
> tent state, which would break its atomicity guarantee.
> The coordinator can communicate asynchronously with the par-
> ticipants via message channels to tolerate temporarily unavailable
> ones. As the transaction requires multiple steps to succeed, and
> the coordinator can fail at any time, it needs to persist the state

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** secure channels, transactions

---

> Chapter 20
> Monitoring
> Monitoring is primarily used to detect failures that impact users
> in production and trigger notifications (alerts) sent to human op-
> erators responsible for mitigating them. The other critical use case
> for monitoring is to provide a high-level overview of the system’s
> health through dashboards.
> In the early days, monitoring was used mostly as a black-box
> approach to report whether a service was up or down, without

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> •the service is always running slightly over-scaled to with-
> stand the occasional individual process failures.
> Because crashes are inevitable and your service is prepared for
> them, you don’t have to come up with complex recovery logic
> whenaprocessgetsintosomeweirddegradedstate— youcanjust
> let it crash. A transient but rare failure can be hard to diagnose and
> fix. Crashing and restarting the affected process gives operators
> maintaining the service some breathing room until the root-cause

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> limit?
> •Can the change be rolled back safely, if needed?
> Code changes shouldn’t be the only ones going through this
> review process.  For example, cloud resource templates, static
> assets, end-to-end tests, and configuration files should all be
> version-controlled in a repository (not necessarily the same) and
> be treated just like code. The same service can then have multiple
> CD pipelines, one for each repository, that can potentially run in
> parallel.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> Chapter 1
> Introduction
> Adistributedsystemisoneinwhichthefailureofacomputer
> you didn’t even know existed can render your own computer
> unusable.
> – Leslie Lamport
> Loosely speaking, a distributed system is composed of nodes that
> cooperate to achieve some task by exchanging messages over com-
> munication links. A node can generically refer to a physical ma-
> chine (e.g., a phone) or a software process (e.g., a browser).
> Why do we bother building distributed systems in the first place?

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication

---

> about monitoring later in the book, but the point I want to make
> here is that you have to measure what happens at the integration
> 5
> https://requests.readthedocs.io/en/master/user/quickstart/#timeouts
> 6
> https://github.com/golang/go/issues/24138
> 7
> https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpclient.t
> imeout?view=netcore-3.1#remarks
> 8
> https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-
> with-jitter/

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** continuous integration

---

> A message channel is implemented by a messaging service, like
> AWS SQS
> 13
> or Kafka
> 14
> . The messaging service, or broker, acts as
> a buffer for messages. It decouples producers from consumers so
> that they don’t need to know the consumers’ addresses, how many
> of them there are, or whether they are available.
> Different message brokers implement the channel abstraction dif-
> ferently depending on the tradeoffs and the guarantees they offer.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** udp tradeoffs, messaging

---

> If the external cache is down, how should the service react? You
> would think it might be okay to temporarily bypass the cache
> and directly hit the dependency. But in that case, the dependency
> might not be prepared to withstand a surge of traffic since it’s
> usually shielded by the cache. Consequently, the external cache
> becoming unavailable could easily cause a cascading failure
> resulting in the dependency to become unavailable as well.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> variety of health signals can be used to make that decision, such
> as:
> •the result of end-to-end tests;
> •health metrics like latencies and errors;
> •alerts;
> •and health endpoints.
> Monitoring just the health signals of the service being rolled out
> is not enough. The CD pipeline should also monitor the health of
> upstream and downstream services to detect any indirect impact
> of the rollout. The pipeline should allow enough time to pass be-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> at different times, as followers are not entirely in sync (see Figure
> 10.5).
> Figure 10.5:Although followers have a different view of the sys-
> tems’ state, they process updates in the same order.
> The consistency model in which operations occur in the same or-
> der for all observers, but doesn’t provide any real-time guarantee
> about when an operation’s side-effect becomes visible to them, is
> calledsequential consistency
> 5
> . The lack of real-time guarantees is

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, sequential consistency

---

> The sidecar processes form the data plane of aservice mesh
> 9
> , which
> is configured by a corresponding control plane. This approach has
> been gaining popularity with the rise of microservices in organi-
> zations that have hundreds of services communicating with each
> other. Popular sidecar proxy load balancers as of this writing are
> NGINX, HAProxy, and Envoy. The advantage of using this ap-
> proach is that it distributes the load-balancing functionality to the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> troller handles incoming requests using the service interface.
> Aprocessrunningaserviceisreferredtoasa
> server
> , whileaprocess
> that sends requests to a server is referred to as aclient. Sometimes,
> a process is both a client and a server, since the two aren’t mutually
> exclusive.
> For simplicity, I will assume that an individual instance of a ser-
> vice runs entirely within the boundaries of a single server process.
> Similarly, I assume that a process has a single thread. This allows

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> using a custom header (e.g.,Accept-Version:  v1) or theAc-
> ceptheader with content negotiation (e.g.,Accept:  applica-
> tion/vnd.example.v1+json).
> As a general rule of thumb, you should try to evolve your API
> in a backwards-compatible way unless you have a very good rea-
> son, in which case you need to be prepared to deal with the conse-
> quences. Backwards-compatible APIs tend to be not particularly
> elegant, but they are a necessary evil. There are tools
> 15
> that can

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, content negotiation

---

> Introduction
> Asyouscaleoutyourapplications, anyfailurethatcanhappenwill
> eventually happen. Hardware failures, software crashes, memory
> leaks — you name it. The more components you have, the more
> failures you will experience.
> Suppose you have a buggy service that leaks 1 MB of memory on
> average every hundred requests. If the service does a thousand
> requests per day, chances are you will restart the service to deploy
> a new build before the leak reaches any significant size. But if your

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> build a distributed application. In this part, we will explore the
> core distributed algorithms at the heart of large scale services.
> Chapter
> 6introduces formal models that encode our assumptions
> about the behavior of nodes, communication links, and timing;
> think of them as abstractions that allow us to reason about dis-
> tributed systems by ignoring the complexity of the actual technolo-
> gies used to implement them.
> Chapter7describes how to detect that a remote process is unreach-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, communication

---

> ter the other. But in a distributed system, there is no shared global
> clock that all processes agree on and can be used to order their
> operations. And to make matters worse, processes can run con-
> currently.
> It’s challenging to build distributed applications that work as in-
> tended without knowing whether one operation happened before
> another. Can you imagine designing a TCP-like protocol without
> using sequence numbers to order the packets? In this chapter, we

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, operations

---

> tentially return more data than the one for a mobile application, as
> the screen estate is larger and more information can be presented
> at once. Also, network calls are expensive for mobile clients, and
> requests generally need to be batched to reduce battery usage.
> To meet these different and competing requirements, the gateway
> can provide different APIs tailored to different use cases and trans-
> late these APIs to the internal ones. An increasingly popular ap-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, api gateway

---

> out scaling. Depending on how the load increases, you are bound
> to hit that brick wall sooner or later. One thing is an organic in-
> crease in load that gives you the time to scale out your service ac-
> cordingly, but another is a sudden and unexpected spike.
> Forexample, considerthenumberofrequestsreceivedbyaservice
> in a period of time. The rate and the type of incoming requests
> can change over time, and sometimes suddenly, for a variety of
> reasons:

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> before it can be merged into the repository. The reviewer has to
> validate whether the change is correct and safe to be released to
> production automatically by the CD pipeline. A checklist can help
> the reviewer not to forget anything important:
> •Does the change include unit, integration, and end-to-end
> tests as needed?
> •Does the change include metrics, logs, and traces?
> •Can this change break production by introducing a
> backward-incompatible change, or hitting some service
> limit?

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> the logging verbosity for investigation purposes and reduce costs
> when granular logs aren’t needed.
> Sampling
> 2
> is another option to reduce verbosity. For example, a
> service could log only one every n-th event. Additionally, events
> can also be prioritized based on their expected signal to noise ra-
> tio; for example, logging failed requests should have a higher sam-
> pling frequency than logging successful ones.
> The options discussed so far only reduce the logging verbosity on

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> = 14.4
> To improve recall, you can have multiple alerts with different
> thresholds. For example, a burn rate below 2 could be a low-
> severity alert that sends an e-mail and is investigated during
> working hours. The SRE workbook has some great examples
> 13
> of
> how to configure alerts based on burn rates.
> 13
> https://sre.google/workbook/alerting-on-slos/

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** burn rate alerting

---

> of loosely-coupled components that can be deployed and scaled
> independently called services.
> Aserviceimplements one specific part of the overall system’s ca-
> pabilities. At the core of its implementation is the business logic,
> which exposes interfaces used to communicate with the outside
> world. By interface, I mean the kind offered by your language of
> choice, like Java or C#. An “inbound” interface defines the opera-
> tions that a service offers to its clients. In contrast, an “outbound”

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> proach to tailor APIs to individual use cases is to use graph-based
> APIs. Agraph-based APIexposes a schema composed of types,
> fields, and relationships across types. The API allows a client to
> declare what data it needs and let the gateway figure out how to
> translate the request into a series of internal API calls.
> This approach reduces the development time as there is no need
> to introduce different APIs for different use cases, and the clients

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** apis, api gateway

---

> CHAPTER 20. MONITORING212
> the service is broken and 1 that everything is working as expected
> (see Figure20.1). As we will see later in the chapter, ratios also
> simplify the configuration of alerts.
> These are some commonly used SLIs for services:
> •Response time— The fraction of requests that are completed
> faster than a given threshold.
> •Availability— The proportion of time the service was usable,
> defined as the number of successful requests over the total
> number of requests.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> are forced to guard against the worst-case long-tail behavior, you
> happen to improve the average case as well.
> 20.3 Service-level objectives
> Aservice-level objective(SLO) defines a range of acceptable values
> for an SLI within which the service is considered to be in a healthy
> state (see Figure
> 20.2). An SLO sets the expectation to its users
> of how the service should behave when it’s functioning correctly.
> Service owners can also use SLOs to define a service-level agree-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> •a description of the chart with links to runbooks, related
> dashboards, and escalation contacts;
> •a horizontal line for each configured alert threshold, if any;
> •a vertical line for each relevant deployment.
> Metrics that are only emitted when an error condition occurs can
> be hard to interpret as charts will show wide gaps between the
> data points, leaving the operator wondering whether the service
> stopped emitting that metric due to a bug. To avoid this, emit a

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 21. OBSERVABILITY228
> to metrics and other instrumentation tools. Logging libraries can
> add overhead to your services if misused, especially when they
> are not asynchronous and logging blocks while writing to stdout
> or disk. Also, if the disk fills up due to excessive logging, the ser-
> vice instance might get itself into a degraded state. At best, you
> lose logging, and at worst, the service instance stops working if it
> requires disk access to handle requests.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> So far, we have discussed serializing all reads through the leader.
> But doing so creates a single choke point, which limits the system’s
> throughput. On top of that, the leader needs to contact a majority
> 4
> https://jepsen.io/consistency/models/linearizable

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** consistency models

---

> in the rest of the book, not just in the context of HTTP requests. An
> idempotent request makes it possible to safely retry requests that
> have succeeded, but for which the client never received a response;
> for example, because it crashed and restarted before receiving it.
> 5.4 Response status codes
> After the service has received a request, it needs to send a response
> back to the client. The HTTP response contains astatus code
> 12
> to
> 12
> https://httpstatuses.com/

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 8. TIME61
> tamps of different nodes can’t be compared with each other.
> Since we don’t have a way to synchronize wall-time clocks across
> processes perfectly, we can’t depend on them for ordering opera-
> tions. To solve this problem, we need to look at it from another
> angle. We know that two operations can’t run concurrently in a
> single-threaded process as one must happen before the other. This
> happened-before
> 3
> relationship creates a causal bond between the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** operations, happened-before relation

---

> Debugging systems failures becomes more challenging as well, as
> you can’t just load the whole application on your local machine
> and step through it with a debugger. The system has more ways to
> fail, since there are more moving parts. This is why good logging
> and monitoring becomes crucial.
> Eventual consistency
> A side effect of splitting an application into separate services is that
> the data model no longer resides in a single data store. As we have

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, eventual consistency

---

> Creating more service instances can be a fast and cheap way to
> scale out a stateless service, as long as you have taken into account
> the impact on its dependencies. For example, if every service in-
> stance needs to access a shared data store, eventually, the data
> store will become a bottleneck, and adding more service instances
> to the system will only strain it further.
> The routing, or balancing, of requests across a pool of servers is

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 17. UPSTREAM RESILIENCY184
> 17.5). This reduces the shared state’s accuracy, but it’s a good
> trade-off as it reduces the load on the database and the number
> of requests sent to it.
> Figure 17.5:Servers batch bucket updates in memory for some
> time, and flush them asynchronously to the database at the end
> of it.
> What happens if the database is down? Remember the CAP theo-
> rem’s essence: when there is a network fault, we can either sacri-

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** resiliency, database systems

---

> system.
> End-to-end tests can be painful and expensive to maintain. For
> example, when an end-to-end test fails, it’s not always obvious
> which service is responsible and deeper investigation is required.
> But they are a necessary evil to ensure that user-facing scenarios
> work as expected across the entire application. They can uncover
> issues that tests with smaller scope can’t, like unanticipated side
> effects and emergent behaviors.
> One way to minimize the number of end-to-end tests is to frame

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> significantly less time than releasing it to production, bugs can be
> detected earlier.
> You can even have multiple pre-production environments, start-
> ing with one created from scratch for each artifact and used to run
> simple smoke tests, to a persistent one similar to production that
> receives a small fraction of mirrored requests from it. AWS, for ex-
> ample, uses multiple pre-production environments
> 3
> (Alpha, Beta,
> and Gamma).
> A service released to a pre-production environment should call the

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> As we have discussed, human operators are still a fundamental
> part of operating a service as there are things that can’t be auto-
> mated, like mitigating an incident. Debugging is another example
> of such a task. When a system is designed to tolerate some level of
> degradation and self-heal, it’s not necessary or possible to monitor
> every way it can get into an unhealthy state. You still need tooling
> and instrumentation to debug complex emergent failures because

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> a single node. As you scale out and add more nodes, logging vol-
> ume will necessarily increase. Even with the best intentions, some-
> one could check-in a bug that leads to excessive logging. To avoid
> costs soaring through the roof or killing your logging pipeline en-
> tirely, log collectors need to be able to rate-limit requests. If you
> use a third-party service to ingest, store, and query your logs, there
> probably is a quota in place already.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> of the transaction as it advances. By modeling the transaction as
> a state machine, the coordinator can durably checkpoint its state
> to a database as it transitions from one state to the next. This en-
> sures that if the coordinator crashes and restarts, or another pro-
> cess is elected as the coordinator, it can resume the transaction
> from where it left off by reading the last checkpoint.
> There is a caveat, though; if the coordinator crashes after sending

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transactions, database systems

---

> out of the pool.
> Healthchecksarecriticaltoachievinghighavailability; ifyouhave
> a service with 10 servers and one is unresponsive for some reason,
> then 10% of the requests will fail, which will cause the service’s
> availability to drop to 90%.
> Let’s have a look at the different types of health checks that you
> can leverage in your service.
> 17.5.1 Health checks
> Aliveness health testis the most basic form of checking the health
> of a process. The load balancer simply performs a basic HTTP

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> locks, but not to release them. In the shrinking phase, the transac-
> tion is permitted only to release locks, but not to acquire them. If
> these rules are obeyed, it can be formally proven that the protocol
> guarantees serializability.
> Theoptimisticapproach to concurrency control doesn’t block, as
> it checks for conflicts only at the very end of a transaction. If a
> conflict is detected, the transaction is aborted or restarted from
> the beginning. Generally, optimistic concurrency control is im-
> 4

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** transactions, concurrency theory

---

> learned in previous chapters, atomically updating records stored
> in different data stores, and guaranteeing strong consistency, is
> slow, expensive, and hard to get right. Hence, this type of archi-
> tecture usually requires embracing eventual consistency.
> 12.1.3 Practical considerations
> Splitting an application into services adds a lot of complexity to
> the overall system. Because of that, it’s generally best to start with
> a monolith and split it up only when there is a good reason to do
> so
> 3
> .

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, eventual consistency

---

> will send only a single request out to the remote dependency to
> fetch the missing entry.
> 14.3.3 Out-of-process cache
> An external cache, shared across all service instances, addresses
> some of the drawbacks of using an in-process cache at the expense
> of greater complexity and cost.
> Because the external cache is shared among the service instances,
> there can be only a single version of each data item at any given
> time. And although the cached item can be out-of-date, every

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> second is 4 seconds, the third is 8 seconds, and any further delay
> will be capped to 8 seconds.
> Although exponential backoff does reduce the pressure on the
> downstream dependency, there is still a problem.  When the
> downstream service is temporarily degraded, it’s likely that mul-
> tiple clients see their requests failing around the same time. This
> causes the clients to retry simultaneously, hitting the downstream
> service with load spikes that can further degrade it, as shown in
> Figure16.1.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 17. UPSTREAM RESILIENCY183
> at most 2 buckets. And if it can touch at most two buckets, there
> is no point to store the third oldest bucket, the fourth oldest one,
> and so on.
> To summarize, this approach requires two counters per API key,
> which is much more efficient in terms of memory than the naive
> implementation storing a list of requests per API key.
> 17.3.2 Distributed implementation
> When more than one process accepts requests, the local state no

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** distributed systems, resiliency

---

> that all the processes behind the load balancer fail the health check.
> In that case, a naive load balancer would just take all service in-
> stances out of rotation, bringing the entire service down!
> A smart load balancer instead detects that a large fraction of the
> service instances is being reported as unhealthy and considers the
> health check to no longer be reliable. Rather than continuing to re-
> move processes from the pool, it starts to ignore the health-checks

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 18. TESTING198
> 18.3 Practical considerations
> As with everything else, testing requires making tradeoffs.
> Suppose we want to test the behavior of a specific user-facing API
> endpoint offered by a service. The service talks to a data store,
> an internal service owned by another team, and a third-party API
> used for billing (see Figure18.2). As mentioned earlier, the gen-
> eral guideline is to write the smallest test possible with the desired
> scope.
> Figure 18.2:How would you test the service?

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> CHAPTER 20. MONITORING216
> When setting the target range for your SLOs, start with comfort-
> able ranges and tighten them as you build up confidence. Don’t
> just pick targets that your service meets today that might become
> unattainable in a year after the load increases; work backward
> from what users care about. In general, anything above 3 nines
> of availability is very costly to achieve and provides diminishing
> returns.
> How many SLOs should you have? You should strive to keep

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

> when a service instance is running out of memory.
> 20.5 Dashboards
> After alerting, the other main use case for metrics is to power real-
> time dashboards that display the overall health of a system.
> Unfortunately, dashboards can easily become a dumping ground
> for charts that end up being forgotten, have questionable useful-
> ness, or are just plain confusing. Good dashboards don’t happen
> by coincidence. In this section, I will present some best practices
> on how to create useful dashboards.

**Categories:** distributed systems, network engineering, systems architecture, site reliability engineering, software engineering, security engineering
**Concepts:** microservices, service mesh

---

### Cmp Books - Embedded Systems Design

*File: Cmp Books - Embedded Systems Design.pdf*

> , 80  
> core 25
>   
> corruption 105
>   
> cost xx
>   
> coverage 144
> , 189  
> See also testing and white-box tests
>   
> cache 200
>   
> decision 198
>   
> hardware instrumentation 199
>   
> ISR 201
>   
> logic analyzer 200
>   
> measuring 197–201
>   
> modified condition 198
>   
> software instrumentation 197
>   
> tools 198
>   
> co-verification 61
> , 196  
> critical 
> sequence 195
>   
> cross compiler 38
>   
> cross-triggering 177
> , 180  
> crt0 78–79
>   
> customer interviews 4
> , 6  
> D  
> data 
> section 84
>   
> space 71
>   
> Dataquest 106
>   
> T
> E
> A
> M

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** customer research tour, trace-triggering and cross-triggering, unit testing, condition coverage, stress testing, test instrumentation, software instrumentation, dynamic memory instrumentation

---

> written about the correct way to develop software, so I won’t cover that again here. 
> What is relevant to this subject is the best practices for testing software that has 
> mission-critical or tight performance constraints associated with it. Just as with the 
> particular problems associated with debugging a real-time system, testing the 
> same system can be equally challenging. I’ll address this and other testing issues 
> in Chapter 9
> . 
>  
> Maintaining and Upgrading Existing Products

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems, mission-critical software, unit testing, system testing, stress testing, performance testing

---

> making simulation tests difficult and unreliable. 
>  Your company can be sued if your code fails. 
> Because of these differences, testing for embedded software differs from 
> application testing in four major ways. First, because real-time and concurrency 
> are hard to get right, a lot of testing focuses on real-time behavior. Second, 
> because most embedded systems are resource-constrained real-time systems, 
> more performance and capacity testing are required. Third, you can use some real-

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, real-time systems, unit testing, system testing, stress testing, performance testing, resource-constrained design testing

---

> substantially change the size and layout of the code. In some cases, the 
> instrumentation intrusion could cause a failure to occur in the function testing — or 
> worse, mask a real bug that would otherwise be discovered. 
> Instrumentation intrusion isn’t the only downside to software-based coverage 
> measurements. If the system being tested is ROM-based and the ROM capacity is 
> close to the limit, the instrumented code image might not fit in the existing ROM.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, test coverage measurement, stress testing, test instrumentation, software instrumentation, dynamic memory instrumentation

---

> T  
> TESTCASE 86  
> testing 185
> , 194–208  
> See also Chapter 9
>   
> See also intrusion
>   
> and cache 205
>   
> and maintenance 206
>   
> benefits 187
>   
> black-box 191–192
>   
> See also black-box tests
>   
> boundry value 191
>   
> cases 191
>   
> coverage 189
>   
> error guessing 191
>   
> evaluating 197
>   
> exception 191
>   
> glass-box 
> See white-box testing
>   
> intrusion 198
>   
> memory use 202
>   
> mission-critical 186
>   
> objectives 186
>   
> performance 192
>   
> power constraint xxi
>   
> random 192
>   
> regression 188

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** mission-critical software, unit testing, regression testing, stress testing, performance testing, exception testing, random testing

---

> Mishaps.” Embedded Systems Programming, November 2000, 28. 
>  Murphy, Niall. “Safe Systems Through Better User Interfaces.” 
> Embedded Systems Programming, August 1998, 32. 
>  Tindell, Ken. “Real-Time Systems Raise Reliability Issues.” Electronic 
> Engineering Times, 17 April 2000, 86.  
>  
>  
> To Reduce Costs 
> The classic argument for testing comes from Quality Wars by Jeremy Main. 
> In 1990, HP sampled the cost of errors in software development during the year.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** systems engineering, embedded systems testing, real-time systems, unit testing, system testing, stress testing

---

> in the following section: “Performance Testing
> .” 
>  
> Performance Testing 
> The last type of testing to discuss in this chapter is performance testing. This is the 
> last to be discussed because performance testing, and, consequently, performance 
> tuning, are not only important as part of your functional testing but also as 
> important tools for the maintenance and upgrade phase of the embedded life cycle. 
> Performance testing is crucial for embedded system design and, unfortunately, is

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, unit testing, system testing, stress testing, performance testing, maintenance and upgrade phase testing

---

> emulator xxv, 41, 111, 120–125, 165  
> See also emulator
> ,ROM  
> shadow 166
>   
> space xxiv
>   
> RTE 75
>   
> RTOS xx
> , 23, 32–37, 64–65, 80, 102, 116, 133, 197, 202  
> and performance 202
>   
> and watchdog 104
>   
> availability 32
>   
> checklist 33
>   
> debugging tools 36
>   
> device drivers 35
>   
> integration testing 195
>   
> performance 35
>   
> services 37
>   
> support 39
>   
> technical support 36
>   
> RTS 75
> , 77  
> run control 15
> , 116, 166, 173, 179  
> run-time environment 70
> , 77–81  
> run-time library 80
>   
> S

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, stress testing, performance testing, device drivers and rtos services testing

---

> transition 133
> , 136  
> statechart 106
> , 108–109  
> statement coverage 192
> , 198  
> See also testing
>   
> static storage 71
>   
> statistical profiling 142
>   
> status bits 94
>   
> stress tests 191
>   
> structured analysis 107
>   
> stub code 49
> , 61  
> substitution memory xxv
> , 15, 180  
> See also overlay memory
>   
> symbol 
> external 86
>   
> internal 86
>   
> symbol table 69
> , 83, 86, 132  
> symbolic trigger 133
>   
> synchronization 99
>   
> system 
> integrity check 78
>   
> recovery 105
>   
> startup xxiv
> , 70, 73–80

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** concurrency and synchronization, unit testing, system testing, statement coverage, stress testing, concurrency theory and synchronization

---

> Chapter 5: Special Software Techniques 
> Listing 5.1: UART code.  
> Listing 5.2:
>  Non-reentrant function.  
> List of Sidebars 
> Introduction  
> Speed vs. Power  
> A ROM Emulator
>   
> Chapter 1: The Embedded Design Life Cycle 
> The Ideal Customer Research Tour  
> Flight Deck on the Bass Boat?
>   
> Laser Printer Design Algorithm
>   
> Big Endian/Little Endian Problem
>   
> Debugging an Embedded System
>   
> Compliance Testing
>   
> Chapter 2: The Selection Process 
> Distorting the Dhrystone Benchmark  
> My Ideal Compiler

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, customer research tour, processor selection process, unit testing, system testing, stress testing

---

> Chapter 7: BDM, JTAG, and Nexus 
> Hardware Instability  
> Chapter 8: The ICE — An Integrated Solution 
> Why Emulators Aren’t Used More  
> Making the Connection
>   
> So what’s a good trigger signal?
>   
> Distributed Emulators
>   
> Chapter 9: Testing 
> Developing Mission-Critical Software Systems  
> Infamous Software Bugs
>   
> Dimensions of Integration
>   
> Measuring More than Statement Execution
>   
> Dynamic Memory Use
>   
> Chapter 10: The Future 
> It’s the Fabs

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, mission-critical software, unit testing, integration testing, system testing, stress testing

---

> integration process and provide an environment for better communications 
> between the teams. Furthermore, uncertainties and errors in system specifications 
> could be easily uncovered and corrected. For the software team, the gain is the 
> elimination of the need to write stub code. In fact, the team could test the actual 
> code under development against the virtual hardware under development at any 
> point in the design process, testing hardware/software behavior at the module

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, system testing, stress testing

---

> should be reflected in the test plan. These differences tend to give embedded 
> systems testing its own distinctive flavor. This chapter covers the basics of testing 
> and test case development and points out details unique to embedded systems 
> work along the way. 
> Why Test? 
> Before you begin designing tests, it’s important to have a clear understanding of 
> why you are testing. This understanding influences which tests you stress and

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, test case design, stress testing

---

> Unit Testing 
> Individual developers test at the module level by writing stub code to substitute for 
> the rest of the system hardware and software. At this point in the development 
> cycle, the tests focus on the logical performance of the code. Typically, developers 
> test with some average values, some high or low values, and some out-of-range 
> values (to exercise the code’s exception processing functionality). Unfortunately,

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing, performance testing, exception testing

---

> starting with the functional tests, you can minimize any duplication of efforts and 
> rewriting of tests. Thus, in my opinion, functional tests come first. Everyone agrees 
> that functional tests can be written first, but Ross[7], for example, clearly believes 
> they are most useful during system integration ... not unit testing. 
> The following is a simple process algorithm for integrating your functional and 
> coverage testing strategies:

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, system testing, stress testing

---

>  Exception tests: Tests that should trigger a failure mode or exception 
> mode. 
>  Error guessing: Tests based on prior experience with testing software 
> or from testing similar programs. 
>  Random tests: Generally, the least productive form of testing but still 
> widely used to evaluate the robustness of user-interface code. 
>  Performance tests: Because performance expectations are part of the 
> product requirement, performance analysis falls within the sphere of functional 
> testing.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing, performance testing, exception testing, random testing

---

> written. 
> From an embedded systems point of view, coverage testing is the most important 
> type of testing because the degree to which you can show how much of your code 
> has been exercised is an excellent predictor of the risk of undetected bugs you’ll be 
> facing later. 
> Example white-box tests include: 
>  Statement coverage: Test cases selected because they execute every 
> statement in the program at least once. 
>  Decision or branch coverage: Test cases chosen because they cause

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, statement coverage, stress testing

---

> time trace tools to measure how well the tests are covering the code. Fourth, you’ll 
> probably test to a higher level of reliability than if you were testing application 
> software.  
>  
> Dimensions of Integration 
> Most of our discussion of system integration has centered on hardware and soft 
> ware integration. However, the integration phase really has three dimensions to it: 
> hardware, software, and real-time. To the best of my knowledge, it’s not common

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, system testing, stress testing

---

> Sometimes the hardware simulator can be as simple as a parallel I/O interface that 
> simulates a user pressing switches. Some projects might require a full flight 
> simulator. At any rate, regression testing of real- time behavior won’t be possible 
> unless the real-time events can be precisely replicated. 
> Unfortunately, budget constraints often prohibit building a simulator. For some 
> projects, it could take as much time to construct a meaningful model as it would to

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems, unit testing, regression testing, stress testing

---

> Because they involve the least hardware, I’ll begin with the software- based 
> methods. Later I’ll discuss some less intrusive, but sometimes less reliable, 
> hardware-based methods. Despite the fact that the hardware-based methods are 
> completely nonintrusive, their use is in the minority. 
> Software Instrumentation 
> Software-only measurement methods are all based on some form of execution 
> logging. Statement coverage can be measured by inserting trace calls at the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** statement coverage, test instrumentation, software instrumentation, trace logging, dynamic memory instrumentation

---

> Hardware Instrumentation 
> Emulation memories, logic analyzers, and IDEs are potentially useful for test-
> coverage measurements. Usually, the hardware functions as a trace/ capture 
> interface, and the captured data is analyzed offline on a separate computer. In 
> addition to these three general-purpose tools, special-purpose tools are used just 
> for performance and test coverage measurements.  
> Emulation Memory 
> Some vendors include a coverage bit among the attribute bits in their emulation

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test coverage measurement, test instrumentation, software instrumentation, emulation memory coverage bits, dynamic memory instrumentation

---

> Maintenance and Testing 
> Some of the most serious testers of embedded software are not the original 
> designers, the Software Quality Assurance (SWQA) department, or the end users. 
> The heavy-duty testers are the engineers who are tasked with the last phases of 
> the embedded life cycle: maintenance and upgrade. Numerous studies (studies by 
> Dataquest and EE Times produced similar conclusions) have shown that more than

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, software quality assurance, unit testing, stress testing, maintenance and upgrade phase testing

---

> EEMBC 29  
> LAPD 27
>   
> MIPS 26
>   
> big endian 
> See endian
>   
> bitwise operation 92
>   
> black-box tests 189
> , 191–192  
> board support package 
> See BSP
>   
> board tester 155
>   
> bond-outs 140
>   
> boot loader 105
>   
> boundary value tests 191
>   
> breakpoint xxiv
> , 116, 118–119, 122  
> hardware 173
>   
> register 119
>   
> BSP 35
> , 102  
> bugs 
> See also testing
>   
> cost 53
> , 58, 187  
> historical 189
>   
> realtime 195
>   
> synchronization 99
>   
> burglar alarm 98
>   
> byte order 12
> , 112–114  
> See also endian
>   
> C

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** concurrency and synchronization, unit testing, boundary value testing, stress testing, concurrency theory and synchronization

---

> inline assembly 38
> , 90  
> Instruction 62
>   
> instruction set simulator 
> See ISS
>   
> integration 
> testing 194
>   
> intellectual property 56
>   
> internal symbol 86
>   
> interrupt 70
> , 97–98, 166  
> context 74
>   
> disabling 75
> , 97–98  
> function 38
>   
> latency 97
>   
> linkage 71
>   
> nested 98
>   
> response 74–76
>   
> vector 71
> , 116, 166  
> interrupt service routine 
> See ISR
>   
> interviews, customer 4
> , 6  
> intrusion 
> compiler 142
>   
> coverage tools 198
>   
> physical 125
>   
> realtime 125
>   
> signal 125
>   
> ISR 75

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** customer research tour, rtos integration, unit testing, integration testing, stress testing

---

> However, the most important point to take away from this discussion is that 
> software failure is far less tolerable in an embedded system than in your average 
> desktop PC. That is not to imply that software never fails in an embedded system, 
> just that most embedded systems typically contain some mechanism, such as a 
> watchdog timer
> , to bring it back to life if the software loses control. You’ll find out 
> more about software testing in Chapter 9
> . 
> Embedded systems have power constraints

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

>  Independent hardware and software design tasks 
>  Integration of the hardware and software components 
>  Product testing and release 
>  On-going maintenance and upgrading

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, stress testing

---

> The embedded design process is not as simple as Figure 1.1
>  depicts. A 
> considerable amount of iteration and optimization occurs within phases and 
> between phases. Defects found in later stages often cause you to “go back to 
> square 1.” For example, when product testing reveals performance deficiencies 
> that render the design non-competitive, you might have to rewrite algorithms, 
> redesign custom hardware — such as Application-Specific Integrated Circuits

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** cost of defects, unit testing, stress testing, performance testing

---

> available is to single-step the processor. However, with these tools at your disposal, 
> your approach to debugging will be remarkably similar to debugging an application 
> designed to run on your PC or workstation. 
> Product Testing and Release 
> Product testing takes on special significance when the performance of the 
> embedded system has life or death consequences attached. You can shrug off an 
> occasional lock-up of your PC, but you can ill-afford a software failure if the PC

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing, performance testing

---

> controls a nuclear power generating station’s emergency system. Therefore, the 
> testing and reliability requirements for an embedded system are much more 
> stringent than the vast majority of desktop applications. Consider the embedded 
> systems currently supporting your desktop PC: IDE disk drive, CD-ROM, scanner, 
> printer, and other devices are all embedded systems in their own right. How many 
> times have they failed to function so that you had to cycle power to them?

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

> problems exist on the desktop as well. 
> However, testing is more than making sure the software doesn’t crash at a critical 
> moment, although it is by no means an insignificant consideration. Because 
> embedded systems usually have extremely tight design margins to meet cost goals, 
> testing must determine whether the system is performing close to its optimal 
> capabilities. This is especially true if the code is written in a high-level language 
> and the design team consists of many developers.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

> Compliance Testing 
> Compliance testing is often overlooked. Modern embedded systems are awash in 
> radio frequency (RF) energy. If you’ve traveled on a plane in the last five years, 
> you’re familiar with the requirement that all electronic devices be turned off when 
> the plane descends below 10,000 feet. I’m not qualified to discuss the finer points 
> of RF suppression and regulatory compliance requirements; however, I have spent

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

> The percentage of project time spent in each phase of the embedded 
> design life cycle. The curve shows the cost associated with fixing a defect 
> at each stage of the process.  
> Like debugging, many of the elements of reliability and performance testing map 
> directly on the best practices for host-based software development. Much has been

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, unit testing, stress testing, performance testing

---

> application development, where the hardware is a fait accompli, embedded 
> projects are usually optimization exercises that strive to create both hardware and 
> software that complement each other. This difference is the driving force that 
> defines the three most characteristic elements of the embedded design cycle: 
> selection, partitioning, and system integration. This difference also colors testing 
> and debugging, which must be adapted to work with unproven, proprietary 
> hardware.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, integration testing, system testing, stress testing

---

> standard for processor and compiler comparisons among embedded system 
> designers. 
> Membership in the EEMBC is a bit pricey ($10K) for the casual observer, but the 
> fee gives the members access to the benchmarking suites and to the testing labs. 
> Running Benchmarks 
> Typically, to run a benchmark, you use evaluation boards purchased from the 
> manufacturer, or, if you are a good customer with a big potential sales opportunity,

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** customer research tour, unit testing, system testing, stress testing

---

> Chapter 6: A Basic Toolset 
> Overview 
> Unlike host-based application developers, embedded systems developers seldom 
> program and test on the same machine. Of necessity, the embedded system code 
> must eventually run on the target hardware. Thus, at least some of the testing and 
> debugging must happen while the system is running in the target. The target 
> system seldom includes the file system storage or processor throughput necessary

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

> Chapter 9: Testing 
> Embedded systems software testing shares much in common with application 
> software testing. Thus, much of this chapter is a summary of basic testing 
> concepts and terminology. However, some important differences exist between 
> application testing and embedded systems testing. Embedded developers often 
> have access to hardware-based test tools that are generally not used in application 
> development. Also, embedded systems often have unique characteristics that

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

> Testing minimizes risk to yourself, your company, and your customers. The 
> objectives in testing are to demonstrate to yourself (and regulatory agencies, if 
> appropriate) that the system and software works correctly and as designed. You 
> want to be assured that the product is as safe as it can be. In short, you want to 
> discover every conceivable fault or weakness in the system and software before 
> it’s deployed in the field. 
>  
> Developing Mission-Critical Software Systems

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** mission-critical software, unit testing, system testing, stress testing

---

> and bugs in a released product is significantly higher than during unit testing, for 
> example (see Figure 9.1
> ). 
>  
> Figure 9.1: The cost to fix a problem.  
> Simplified graph showing the cost to fix a problem as a function of the 
> time in the product life cycle when the defect is found. The costs 
> associated with finding and fixing the Y2K problem in embedded systems 
> is a close approximation to an infinite cost model.  
> To Improve Performance

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, performance testing

---

> Testing maximizes the performance of the system. Finding and eliminating dead 
> code and inefficient code can help ensure that the software uses the full potential 
> of the hardware and thus avoids the dreaded “hardware re-spin.”

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing, performance testing

---

> When to Test? 
> It should be clear from Figure 9.1 that testing should begin as soon as feasible. 
> Usually, the earliest tests are module or unit tests conducted by the original 
> developer. Unfortunately, few developers know enough about testing to build a 
> thorough set of test cases. Because carefully developed test cases are usually not 
> employed until integration testing, many bugs that could be found during unit

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, stress testing

---

> testing are not discovered until integration testing. For example, a major network 
> equipment manufacturer in Silicon Valley did a study to figure out the key sources 
> of its software integration problems. The manufacturer discovered that 70 percent 
> of the bugs found during the integration phase of the project were generated by 
> code that had never been exercised before that phase of the project.  
> Unit Testing

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, stress testing

---

> thorough set of test cases. Because carefully developed test cases are usually not 
> employed until integration testing, many bugs that could be found during unit 
> testing are not discovered until integration testing. For example, a major network 
> equipment manufacturer in Silicon Valley did a study to figure out the key sources 
> of its software integration problems. The manufacturer discovered that 70 percent 
> of the bugs found during the integration phase of the project were generated by

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, stress testing

---

> these “black-box” derived test cases are seldom adequate to exercise more than a 
> fraction of the total code in the module. 
> Regression Testing 
> It isn’t enough to pass a test once. Every time the program is modified, it should 
> be retested to assure that the changes didn’t unintentionally “break” some 
> unrelated behavior. Called regression testing, these tests are usually automated 
> through a test script. For example, if you design a set of 100 input/output (I/O)

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, regression testing, test case design, stress testing

---

> Like all testing, functional tests should be designed to be destructive, that is, to 
> prove the program doesn’t work. This means overloading input channels, beating 
> on the keyboard in random ways, purposely doing all the things that you, as a 
> programmer, know will hurt your baby. As an R&D product manager, this was one 
> of my primary test methodologies. If 40 hours of abuse testing could be logged 
> with no serious or critical defects logged against the product, the product could be

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** cost of defects, unit testing, stress testing, random testing

---

> important to test what happens if the system receives an unusually high number of 
> asynchronous events while it is heavily loaded. Do the queues fill up? Is the 
> system still able to meet deadlines? 
> Thorough testing of real-time behavior often requires that the embedded system 
> be attached to a custom hardware/simulation environment. The simulation 
> environment presents a realistic, but virtual, model of the hardware and real world.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, unit testing, system testing, stress testing

---

> You are also faced with the additional chore of placing this instrumentation in your 
> code, either with a special parser or through conditional compilation. 
> Coverage tools based on code instrumentation methods cause some degree of 
> code intrusion, but they have the advantage of being independent of on-chip 
> caches. The tags or markers emitted by the instrumentation can be coded as 
> noncachable writes so that they are always written to memory as they occur in the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** condition coverage, test instrumentation, software instrumentation, dynamic memory instrumentation

---

> (MCDC). Both of these techniques require rather extensive instrumentation of the 
> decision points at the source code level and thus might present increasingly 
> objectionable levels of intrusion. Also, implementing these coverage test methods 
> is best left to commercially available tools.  
>  
> Measuring More than Statement Execution 
> DC takes statement coverage one step further. In addition to capturing the entry

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** statement coverage, test instrumentation, software instrumentation, dynamic memory instrumentation

---

> shows the CodeTEST performance analysis test tool, which 
> uses software instrumentation to provide the stimulus for the entry-point and exit-
> point measurements. These tags can be collected via hardware tools or RTOS 
> services.  
>  
> Dynamic Memory Use 
> Dynamic memory use is another valuable test provided by many of the commercial 
> tools. As with coverage, it’s possible to instrument the dynamic memory allocation 
> operators malloc() and free() in C and new and delete in C++ so that the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test coverage measurement, test instrumentation, software instrumentation, dynamic memory instrumentation

---

> instrumentation tags will help uncover memory leakages and fragmentation 
> problems while they are occurring. This is infinitely preferable to dealing with a 
> nonreproducible system lock-up once every two or three weeks. Figure 9.2
>  shows 
> one such memory management test tool. 
>  
> Figure 9.2: Memory management test tool.  
> The CodeTEST memory management test program (courtesy of Applied 
> Microsys tems Corporation).  
> T
> E
> A
> M
> F
> L
> Y

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test instrumentation, software instrumentation, dynamic memory instrumentation, memory fragmentation analysis

---

> Figure 9.3: CodeTEST test tool.  
>  
>  
> CodeTEST performance analysis tool display showing the minimum, 
> maximum, average, and cumulative execution times for the functions 
> shown in the leftmost column (courtesy of Applied Microsystems 
> Corporation).  
>  
> From the Trenches  
> Performance testing and coverage testing are not entirely separate activities. 
> Coverage testing not only uncovers the amount of code your test is exercising, it

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing, performance testing

---

> stack of source code listings. The lead engineer said someone wheeled that dolly in 
> the previous week and told the team to “make it 25 percent better.” The team’s 
> challenge was to first understand what they had and, more importantly, what the 
> margins were, and then they could undertake the task of improving it 25 percent, 
> whatever that meant. Thus, for over half of the embedded systems engineers 
> doing embedded design today, testing and understanding the behavior of existing

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, unit testing, system testing, stress testing

---

> the real-world events drive the system to test it properly. 
> Although some parts of testing must necessarily be delayed until the end of the 
> development cycle, the key decisions about what to test and how to test must not 
> be delayed. Testability should be a key requirement in every project. With modern 
> SoC designs, testability is becoming a primary criterion in the processor-selection 
> process. 
> Finally, testing isn’t enough. You must have some means to measure the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** processor selection process, unit testing, system testing, stress testing

---

> space 71  
> placeholder 85
>   
> codesign 
> See co-verification
>   
> CodeTEST 203
>   
> ColdFIRE 127
> , 151–152, 154  
> command file 
> linker 84–85
>   
> COMMON 86
>   
> communications port 121
> , 123  
> compiler 39–40
>   
> benchmarking 40
>   
> choosing 39
>   
> code 
> generation 39
>   
> compile only 76
>   
> embedded C++ 39
>   
> features 38
>   
> libraries 39
>   
> optimization 39
> , 142  
> RTOS support 39
>   
> startup code 39
>   
> VHDL 51
>   
> compliance testing 17
>   
> condition coverage 193
>   
> constant storage 71
>   
> context 
> saving 74
> , 80

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, condition coverage, stress testing, test data generation strategies

---

> for debugging 14
>   
> printIntAsHex() 80
>   
> printStr() 80
>   
> priority 
> See interrupt
>   
> probe effect 
> See intrusion
>   
> processor 
> availability 22
>   
> family 42
>   
> military specs 22
>   
> O/S support 23
>   
> performance 22
> , 26  
> selection xix
> , 2, 21  
> tool support 23
>   
> product 
> specification 2
> , 4–7  
> testing 15
>   
> profiling 142
>   
> See also performance
>   
> program 
> counter 74
> , 77, 140  
> loading 116
> , 121, 124  
> sections 84
>   
> programming techniques 89–106
>   
> project management 6

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** processor selection process, unit testing, stress testing, performance testing

---

> PULSE 152  
> PUSH 75
>   
> Q  
> queue size 196  
> R  
> RAM 
> shadow 166
>   
> random tests 192
>   
> real-time 
> and benchmarks 28
>   
> constraints xx
>   
> time-critical xx
>   
> time-sensitive xx
>   
> deadlines 196
>   
> debugging 154
>   
> failure modes 195
>   
> response time 195
>   
> system integration 14
>   
> trace 15
> , 152, 169  
> reconfigurable hardware 209
> , 212–213, 225  
> reentrancy 98–99
>   
> function 99–100
>   
> register 
> debug 154
>   
> frame pointer 77
>   
> program counter 74
> , 77  
> stack pointer 74
>   
> viewing 116

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems, rtos integration, integration testing

---

> designer and not a hardware/software design issue, most digital hardware 
> designers have little or no training in the arcane art of RF suppression. Usually, the 
> hotshot digital wizard has to seek out the last remaining analog designer to get 
> clued in on how to knock down the fourth harmonic at 240MHz. Anyway, CE 
> testing is just as crucial to a product’s release as any other aspect of the test 
> program. 
> CE testing had a negative impact on my hardware/software integration activities in

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, unit testing, integration testing, stress testing

---

> As an example, when the embedded system is powered up, there must be code 
> that initializes the system so that the rest of the code can run. This means 
> establishing the run-time environment, such as initializing and placing variables in 
> RAM, testing memory integrity, testing the ROM integrity with a checksum test, 
> and other initialization tasks.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing

---

> guard the names of other customers, it’s hard to get recommendations from other 
> satisfied customers. Fortunately, if you are part of a large corporation with many 
> other product-development divisions, it’s relatively easy to find out what works 
> and what doesn’t. 
> Device Drivers 
> The availability of device drivers often is tied to the need to develop a board 
> support package (BSP). The BSP consists of the set of drivers and the integration

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** board support package (bsp), rtos integration, integration testing

---

> Real Time Computing magazines, you’ve seen advertisements for tools that show 
> some sort of tool plugged into a target system that consists of a single PC board 
> sitting alone on a desktop, with not even a power supply in sight to spoil the view. 
> The real situation is far less ideal. For example, a customer once hung our first 
> generation in-circuit emulators (ICEs) by chains from the ceiling to get them close 
> to the highest boards in a floor-to-ceiling equipment rack. These emulators

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** customer research tour, test data generation strategies, edge computing

---

> a quality assurance tool makes good sense.  
> The logic analyzer can be used to show what memory locations are being accessed 
> by the processor while it runs the embedded program code. If code quality is 
> important to you, knowing how thoroughly your testing is actually exercising your 
> code (i.e., code coverage) is valuable. Code-coverage measurements are 
> universally accepted as one of the fundamental measurements that should be

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, test coverage measurement, stress testing

---

> debug protocols are used today: BDM (Background Debug Mode), IEEE 1149.1 
> JTAG (Joint Test Action Group), and IEEE-5001 ISTO (Nexus).  
>  
> Hardware Instability 
> In general, you will be integrating unstable hardware with software that has never 
> run on the hardware. The instability of the hardware means that the interface 
> between the processor and the memory might be faulty, so that any code, even a 
> debugger, cannot possibly run reliably in the target system.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** bdm (background debug mode), bdm interface, nexus interface

---

> errors, as noted in The Art of Software Testing by Glen Ford Myers[6]. The 
> problem of selecting appropriate test cases is known as test case design. 
> Although dozens of strategies exist for generating test cases, they tend to fall into 
> two fundamentally different approaches: functional testing and coverage testing. 
> Functional testing (also known as black-box testing) selects tests that assess how 
> well the implementation meets the requirements specification. Coverage testing

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, test case design, stress testing

---

> from radiation overdoses. The problem was traced to a failure in the software 
> responsible for monitoring the patients’ safety.[4] 
> When to Stop? 
> The algorithm from the previous section has a lot in common with the instructions 
> on the back of every shampoo bottle. Taken literally, you would be testing (and 
> shampooing) forever. Obviously, you’ll need to have some predetermined criteria 
> for when to stop testing and to release the product.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing, test stop criteria

---

> remaining statements within the basic block are erroneously marked as having 
> been executed. Perhaps an even more serious shortcoming of measuring 
> statement coverage is that the measurement demonstrates that the actions of an 
> application have been tested but not the reasons for those actions. 
> You can improve your statement coverage by using two more rigorous coverage 
> techniques: Decision Coverage (DC) and Modified Condition Decision Coverage

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test coverage measurement, statement coverage, condition coverage

---

> improving 18  
> measurements 26–32
> , 143  
> measuring 142
>   
> on-chip circuitry 205
>   
> processor 22
>   
> testing 192
> , 201–206  
> physical 
> connection 138
>   
> intrusion 125
>   
> pointer 
> and code optimization 95
>   
> polling loop 94
> , 97  
> POP 75
>   
> port 
> communication 121
> , 123  
> emulator 123
>   
> port-mapped I/O 90
>   
> POST 78
>   
> post-processing 
> trace data 132
>   
> power 
> constraints xviii
>   
> consumption xxii
>   
> failure 167
>   
> power-up 105
>   
> precompiled library 84
>   
> preprocessor 138
>   
> printf() 80

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** trace post-processing and reconstruction, unit testing, stress testing

---

> Emulation control system.  
> Figure 8.3:
>  Mechanical adapter.  
> Figure 8.4:
>  Emulation control system.  
> Chapter 9: Testing 
> Figure 9.1: The cost to fix a problem.  
> Figure 9.2:
>  Memory management test tool.  
> Figure 9.3:
>  CodeTEST test tool.  
> Chapter 10: The Future 
> Figure 10.1: FPGA.  
> Figure 10.2:
>  Gates.  
> Figure 10.3:
>  Interconnecting Elements of FPGA.  
> Figure 10.4:
>  Worldviews.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing

---

> words, does the generation of the debugging information affect the real-time 
> operation of the processor? With a single IEEE 1149.1 port on the processor, the 
> dynamic data flowing out from the port can’t keep up with the processor, and it’s 
> likely that the CPU core would have to periodically stop (stall) to allow the JTAG 
> port to catch up. The Nexus developers anticipated this by defining scalability in 
> terms of features and the I/O hardware necessary to support those features. Thus,

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, jtag debugging, test data generation strategies

---

> but I’ve identified some interesting articles on mission-critical software 
> development: 
>  Brown, Doug. “Solving the Software Safety Paradox.” Embedded 
> Systems Programming, December 1998, 44. 
>  Cole, Bernard. “Reliability Becomes an All-Consuming Goal.” Electronic 
> Engineering Times, 13 December 1999, 90. 
>  Douglass, Bruce Powel. “Safety-Critical Embedded Systems.” 
> Embedded Systems Programming, October 1999, 76. 
>  Knutson, Charles and Sam Carmichael. “Safety First: Avoiding Software

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** systems engineering, mission-critical software, safety-critical systems

---

> cycle. If we accept their point of view, then we may further subdivide the integra 
> tion phase to account for the non-trivial task of creating a board support package 
> (BSP) for the hardware. Without a BSP, the RTOS cannot run on the target plat 
> form. However, if you are using a standard hardware platform in your system, 
> such as one of the many commercially available single-board computers (SBC), 
> your BSP is likely to have already been developed for you. Even with a well-

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** board support package (bsp), rtos integration, integration testing

---

> integration phase 12–15
> , 54  
> iteration and implementation phase 10
>   
> maintenance and upgrade phase 17–19
>   
> partitioning 7
> , 47  
> processor selection 2
> , 21  
> product specification phase 4–7
>   
> shortening 55
>   
> test phase 15–17
>   
> tool view 2
>   
> limitations 138
>   
> Link Access Protocol-D 
> See LAPD
>   
> linker 69
> , 82–87, 91  
> linker commands 84–85
> , 91–92  
> COMMON 86
>   
> END 87
>   
> FORMAT 87
>   
> LISTMAP 86
>   
> LOAD 87
>   
> NAME 86
>   
> ORDER 86
>   
> PAGE 86
>   
> PUBLIC 86
>   
> TESTCASE 86

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** processor selection process, rtos integration, integration testing

---

> hardware. Because the ICE has been primarily designated as a HW/SW integration 
> tool, firmware designers have been the people most closely associated with it. 
>  
>  
> Bullet-Proof Run Control 
> In the most general case, an ICE uses a debug kernel for run-time control but with 
> a difference that eliminates dependence on the target’s untested 
> memory/processor interface. Instead of relying on the target’s processor and 
> memory, the ICE supplies its own processor and memory. A cable or special

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing, test case design

---

> printf() 197  
> real-time 169
>   
> statements 14
>   
> techniques 140
>   
> visibility 140
>   
> traceable cache 140
>   
> transistors xxii
>   
> transition board 127
>   
> translation sequence 83
>   
> transmitter buffer empty (TBMT) 94
>   
> TRAP instruction xxiv
>   
> trap vector 119
>   
> trigger 132–133
> , 135–137, 181  
> cache 141
>   
> in ICE 169
>   
> resources 133
>   
> symbolic 133
>   
> U  
> UART 94  
> virtual 123
>   
> UML 89
> , 106  
> Unified Modeling Language 
> See UML
>   
> unit testing 188
>   
> universal asynchronous receiver/transmitter

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, unit testing, stress testing

---

> (also known as white-box testing) selects cases that cause certain portions of the 
> code to be executed. (These two strategies are discussed in more detail later.) 
> Both kinds of testing are necessary to test rigorously your embedded design. Of 
> the two, coverage testing implies that your code is stable, so it is reserved for 
> testing a completed or nearly completed product. Functional tests, on the other 
> hand, can be written in parallel with the requirements documents. In fact, by

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, test case design, stress testing

---

> to consider real time to be a dimension of the hardware/software integration phase, 
> but it should be. The hardware can operate as designed, the software can run as 
> written and debugged, but the product as a whole can still fail because of real-time 
> issues.  
> Some designers have argued that integrating a real-time operating system (RTOS) 
> with the hardware and application software is a distinct phase of the development

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, rtos integration, integration testing

---

>  Memory substitution — Replacing ROM-based memory with RAM for 
> rapid and easy code download, debug, and repair cycles. 
>  Real-time analysis — Following code flow in real time with real-time 
> trace analysis. 
> For many embedded systems, it is necessary also to integrate a commercial or in- 
> house real-time operating system (RTOS) into the hardware and application 
> software. This integration presents its own set of problems (more variables); the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, rtos integration, integration testing

---

> Figure 7.2: Pinout for the Motorola BDM debug interface.  
> Figure 7.3:
>  Processor codes output.  
> Figure 7.4:
>  BDM command set.  
> Figure 7.5:
>  JTAG loop.  
> Figure 7.6:
>  Debug core using JTAG.  
> Figure 7.7:
>  Pin descriptions.  
> Figure 7.8:
>  Nexus interface.  
> Figure 7.9:
>  Compliance classes 1 through 4.  
> Figure 7.10:
>  Nexus dynamic debugging features.  
> Figure 7.11:
>  I/O pins.  
> Chapter 8: The ICE — An Integrated Solution 
> Figure 8.1: General emulator design.  
> Figure 8.2:

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** jtag debugging, bdm interface, nexus interface

---

> tests, the regression test script would automatically execute the 100 tests and 
> compare the output against a “gold standard” output suite. Every time a change is 
> made to any part of the code, the full regression suite runs on the modified code 
> base to insure that something else wasn’t broken in the process. 
>  
> From the Trenches  
> I try to convince my students to apply regression testing to their course projects;

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, regression testing, stress testing

---

> Embedded Systems Design: An Introduction to Processes, Tools, and 
> Techniques 
> by Arnold S. Berger 
> ISBN: 1578200733 
> CMP Books
>  © 2002 (237 pages) 
> An easy-to-understand guidebook for those embarking upon an embedded 
> processor development project. 
>  
>  
>  
> Table of Contents  
>  
>  
> Embedded Systems Design—An Introduction to Processes, Tools, and 
> Techniques  
>  
> Preface  
>  
> Introduction  
>  
> Chapter 1 - The Embedded Design Life Cycle 
>  
> Chapter 2 - The Selection Process

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, processor selection process

---

> Works Cited 
>  
> 1. Turley, Jim. “High Integration is Key for Major Design Wins.” A paper 
> presented at the Embedded Processor Forum, San Jose, 15 October 
> 1998. 
> 2. Levy, Marcus. “EDN Microprocessor/Microcontroller Directory.” EDN, 14 
> September 2000.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> Figure 1.1 provides a schematic representation of the embedded design life cycle 
> (which has been shown ad nauseam in marketing presentations). 
>  
>  
> Figure 1.1: Embedded design life cycle diagram.  
> A phase representation of the embedded design life cycle.  
> Time flows from the left and proceeds through seven phases: 
>  
>  Product specification 
>  Partitioning of the design into its software and hardware components 
>  Iteration and refinement of the partitioning

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, design iteration and refinement

---

> Know About Hardware/Software Co-Design.” Computer Design, August 
> 1998, 63. 
>  Tuck, Barbara. “The Hardware/Software Co-Verification Challenge.” 
> Computer Design, April 1998, 49.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** hardware/software co-design, hardware/software co-verification

---

> if it cannot be interrupted.) 
> 2. A reentrant function cannot call any other functions that are not 
> themselves reentrant. 
> 3. A reentrant function cannot use the hardware in a non-atomic way. 
> If an ISR were to call a function that was not reentrant, the program would 
> eventually exhibit a mutual access or synchronization bug. Generally, this situation 
> arises when an interrupt asynchronously modifies code that is being used by

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** concurrency and synchronization, concurrency theory and synchronization

---

> Figure 6.4: Typical architectural block diagram.  
>  
> Schematic representation of the Wind River Systems debugger (courtesy 
> of Wind River Systems).  
> The debugger generally provides a range of run control services. Run control 
> services encompass debugging tasks such as: 
>  
>  Setting breakpoints 
>  Loading programs from the host 
>  Viewing or modifying memory and registers 
>  Running from an address 
>  Single-stepping the processor

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** run control and breakpoints, single-stepping and step control

---

> Figure 8.4 points out an important difference between overlay memory and 
> substitution memory. Because overlay memory is mappable and can be assigned a 
> personality, it can be given precedence over memory in the target system by 
> assigning the selected block of address space to emulation memory instead of the 
> target memory. Substitution memory can be used only to replace a block of 
> memory in the target system that is accessed through the ROM socket.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** overlay memory and memory substitution, rom emulation and substitution memory

---

> Quality.” Supplement to Electronic Design, 9 March 1998, 40. 
>  Beatty, Sean. “Sensible Software Testing.” Embedded Systems 
> Programming, August 2000, 98. 
>  Myers, Glenford J. The Art of Software Testing. New York: Wiley, 1978. 
>  Simon, David. An Embedded Software Primer. Reading, MA: Addison- 
> Wesley, 1999.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded systems testing, system testing

---

> code 80
>   
> compiler 142
>   
> ORDER 86
>   
> ORG 83
>   
> overclocking xxii
>   
> overflow 71
>   
> overlay memory 174–175
>   
> See also shadow memory
>  and substitution memory  
> P  
> package 126  
> PAGE 86
>   
> parameters 
> stack frame 77
>   
> partitioning 47
>   
> decision 7
>   
> hardware/software 7
>   
> HW/SW convergence 52–58
>   
> problem space 49
>   
> revising 59
>   
> tools 49
>   
> PBX 206
>   
> performance 
> analyzer 41
>   
> cache 204

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** hardware/software partitioning, overlay memory and memory substitution

---

> system integration 194
>   
> system space 71
>   
> system-on-silicon 
> See SoC

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> condition coverage 193  
> decision coverage 192
>   
> statement coverage 192
>   
> wiggler 150–151
>   
> word size 112

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** statement coverage, condition coverage

---

> released. If a significant defect was found, the clock started over again after the 
> defect was fixed. 
> Coverage Tests 
> The weakness of functional testing is that it rarely exercises all the code. Coverage 
> tests attempt to avoid this weakness by (ideally) ensuring that each code 
> statement, decision point, or decision path is exercised at least once. (Coverage 
> testing also can show how much of your data space has been accessed.) Also

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, statement coverage, stress testing

---

> core, the messages themselves won’t cause the tools to lose synchronization and 
> abort the communications. Tools that understand the messages can interpret them 
> and act on the results. Thus, the private message allows for uniqueness and added 
> functionality within the overall context of an industry-wide standard. Private 
> messaging is the Nexus feature called Data Acquisition in Figure 7.10
> , shown 
> earlier. 
> Considering that high-performance processors can generate a large quantity of

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** concurrency and synchronization, concurrency theory and synchronization

---

> List of Figures 
> Introduction  
> Figure 1: NetROM.  
> Chapter 1: The Embedded Design Life Cycle 
> Figure 1.1: Embedded design life cycle diagram.  
> Figure 1.2:
>  Tools used in the design process.  
> Figure 1.3:
>  The laser printer design.  
> Figure 1.5:
>  An example of the endianness problem in I/O addressing.  
> Figure 1.4:
>  Where design time is spent.  
> Chapter 2: The Selection Process 
> Figure 2.1: Choosing the right processor.  
> Figure 2.2:
>  Microcontrollers versus microprocessors.  
> Figure 2.3:

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, processor selection process

---

> The most commonly used stop criteria (in order of reliability) are: 
>  When the boss says 
>  When a new iteration of the test cycle finds fewer than X new bugs 
>  When a certain coverage threshold has been met without uncovering 
> any new bugs 
> Regardless of how thoroughly you test your program, you can never be certain you 
> have found all the bugs. This brings up another interesting question: How many 
> bugs can you tolerate? Suppose that during extreme software stress testing you

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing, test stop criteria

---

> less accurate by on-chip address and data caches. This occurs because the 
> appearance of an address on the bus does not necessarily mean that the 
> instruction at that address will be executed at that point in time, or any other point 
> in time. It only means that the address was transferred from memory to the 
> instruction cache.  
> Tools based on the instrumentation of code are immune to cache-induced errors 
> but do introduce some level of intrusion because of the need to add extra code to

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test instrumentation, software instrumentation, dynamic memory instrumentation

---

> compare the output against a “gold standard” output suite. Every time a change is 
> made to any part of the code, the full regression suite runs on the modified code 
> base to insure that something else wasn’t broken in the process. 
>  
> From the Trenches  
> I try to convince my students to apply regression testing to their course projects; 
> however, because they are students, they never listen to me. I’ve had more than a

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, regression testing, stress testing

---

> analyze the execution path reported by a logic analyzer.  
> Gray-Box Testing 
> Because white-box tests can be intimately connected to the internals of the code, 
> they can be more expensive to maintain than black-box tests. Whereas black-box 
> tests remain valid as long as the requirements and the I/O relationships remain 
> stable, white-box tests might need to be re-engineered every time the code is 
> changed. Thus, the most cost-effective white-box tests generally are those that

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, gray-box testing, stress testing

---

> module testing 
> See testing
>   
> monitor programs 169
>   
> mutual access 99
>   
> N  
> NAME 86  
> nested interrupts 98
>   
> NetROM xxv
>   
> new 72
> , 80  
> Nexus 149
> , 159  
> IEEE ISTO-5001 141
>   
> levels of compliance 160
>   
> NMI 102
> , 117, 166–167  
> noncachable data 95
>   
> non-maskable interrupt 
> See NMI
>   
> NRE charge 60
>   
> n-wire 150–151
>   
> O  
> object file 82  
> object management group (OMG) 106
>   
> object module 
> relocatable 84
>   
> on-chip circuitry 
> performance counters 205
>   
> optimization 39
>   
> and pointers 95

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing, performance testing

---

> fraction of the total code in the module. 
> Regression Testing 
> It isn’t enough to pass a test once. Every time the program is modified, it should 
> be retested to assure that the changes didn’t unintentionally “break” some 
> unrelated behavior. Called regression testing, these tests are usually automated 
> through a test script. For example, if you design a set of 100 input/output (I/O) 
> tests, the regression test script would automatically execute the 100 tests and

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, regression testing, stress testing

---

> more frequent jumps can certainly affect cache performance. 
> Conceptually, performance testing is straightforward. You use the link map file to 
> identify the memory addresses of the entry points and exit points of functions. You 
> then watch the address bus and record the time whenever you have address 
> matches at these points. Finally, you match the entry points with the exit points, 
> calculate the time difference between them, and that’s your elapsed time in the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing, performance testing

---

> debugger, and debug your target system at the same time?  
>  
> Signal Intrusion 
> Anytime the testing tool has a hardware component, signal intrusion can become a 
> problem. For example, a design team unable to use a particular ROM emulator in 
> its target system complained long and hard to the vendor’s tech-support person. 
> The target worked perfectly with the EPROMs inserted in the ROM sockets but 
> failed intermittently with the ROM emulator installed. Eventually, after all the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing

---

> every branch (both the true and false path) to be executed at least once. 
>  Condition coverage: Test cases chosen to force each condition (term) 
> in a decision to take on all possible logic values. 
> Theoretically, a white-box test can exploit or manipulate whatever it needs to 
> conduct its test. Thus, a white-box test might use the JTAG interface to force a 
> particular memory value as part of a test. More practically, white-box testing might

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, condition coverage, stress testing

---

> See also FPU  
> flowcharts 98
>   
> FORMAT 87
>   
> FP 77
>   
> FPGA 43
> , 210–213  
> FPU 48
>   
> frame pointer See FP
>   
> free memory 72
>   
> FSM 107–108
>   
> See statechart
>   
> function 77
>   
> linkage 71
> , 75, 77  
> preamble 77
>   
> reentrant 99–100
>   
> functional tests 
> See also testing
>   
> See black-box tests
>   
> G  
> geometries 50  
> GEPDIS 
> See Nexus
>   
> glass-box tests 
> See also white-box tests
>   
> global 86
>   
> storage 71
>   
> graphics accellerators 50
>   
> gray-box testing 193
>   
> green wires 13
> , 59  
> H  
> HALT 154

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, gray-box testing, stress testing

---

> regression testing 188
> , 196  
> regulatory compliance 17
>   
> relative byte count 83
>   
> relocatable 
> module 69
> , 82–84  
> remote debugger 111
> , 115–121  
> reprogramming 105
>   
> research 4
>   
> market 4
> , 6  
> RESET 73–74
> , 78, 102, 120, 167  
> resource constraints xxiii
>   
> respin 58–59
>   
> response time 195
>   
> RETI 75
>   
> retread engineer 58
>   
> return 
> from main() 75
>   
> return address 71
> , 75–76  
> and stack frame 77
>   
> reverse engineering 18
>   
> RF suppression 17
>   
> risk 60
> , 186  
> ROM 71

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, regression testing, stress testing

---

> connectors and get by with a smaller power supply by using a highly integrated 
> microcontroller instead of a microprocessor and separate peripheral devices, you 
> have potentially a greater reduction in system costs, even if the integrated device 
> is significantly more costly than the discrete device. This issue is covered in more 
> detail in Chapter 3
> . 
> Embedded systems have real-time constraints 
> I was thinking about how to introduce this section when my laptop decided to back

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems, risk reduction

---

> tempt fate any further, Sue declared a team holiday. The CD700 development 
> team headed out in all directions. 
> Over the course of the next several weeks, the CD700 came closer to its design 
> goals. The ComDelta testing lab was able to simulate 78 users before the system 
> would bog down. Then all progress seemed to stop. Sue called Jon and asked for 
> some help. Jon suggested a one-month rental of the tool systems ICE to do some

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, system testing, stress testing

---

> design different — at least different enough that someone has to write a book 
> about it. A good place to start is to try to enumerate the differences between your 
> desktop PC and the typical embedded system. 
>  
>  Embedded systems are dedicated to specific tasks, whereas PCs are 
> generic computing platforms. 
>  Embedded systems are supported by a wide array of processors and 
> processor architectures. 
>  Embedded systems are usually cost sensitive. 
>  Embedded systems have real-time constraints.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems, edge computing

---

> compiler and good debugging support. In many situations, you’ll need far more, 
> such as in-circuit emulators (ICE), simulators, and so on. 
> Although these four considerations must be addressed in every processor- 
> selection process, in many cases, the optimal fit to these criteria isn’t necessarily 
> the best choice. Other organizational and business issues might limit your choices 
> even further. For example, time-to-market constraints might make it imperative

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** processor selection process, fault tolerance considerations

---

> be called asynchronously from multiple threads without concern for 
> synchronization or mutual access is said to be reentrant. 
>  
> In An Embedded Software Primer, David Simon[10] gives three rules to apply to 
> decide whether a function is reentrant: 
>  
> 1. A reentrant function cannot use variables in a non-atomic way unless 
> they are stored on the stack of the task that called the function or are 
> otherwise the private variables of the task. (A section of code is atomic

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** concurrency and synchronization, concurrency theory and synchronization

---

> Summary 
> Now that you know what is different about embedded systems, it’s time to see 
> how you actually tame the beast. In the chapters that follow, you’ll examine the 
> embedded system design process step by step, as it is practiced. 
> The first few chapters focus on the process itself. I’ll describe the design life cycle 
> and examine the issues affecting processor selection. The later chapters focus on 
> techniques and tools used to build, test, and debug a complete system.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle, processor selection process

---

> tend to cause major bugs that I’ll discuss shortly). Even if you write in assembly 
> (or have inherited a library of legacy code in assembly), you can execute the code 
> on your desktop system using an Instruction Set Simulator (ISS) until you need to 
> test the real-time interaction of the code and the target system’s special hardware. 
> Aside from the availability of real working peripherals, the greatest source of

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** instruction set simulator (iss), real-time systems

---

> Suffice to say that the integration of the RTOS, the hardware, the software and the 
> real-time environment represent the four most common dimensions of the 
> integration phase of an embedded product. Since the RTOS is such a central ele 
> ment of an embedded product, any discussion about tools demands that we dis 
> cuss them in the context of the RTOS itself. A simple example will help to illustrate 
> this point. 
> Suppose you are debugging a C program on your PC or UNIX workstation. For

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, rtos integration, integration testing

---

> If you are designing your system for mission-critical applications, such as the 
> navigational software in a commercial jetliner, the degree to which you must test 
> your code is painstakingly spelled out in documents, such as the FAA’s DO-178B 
> specification. Unless you can certify and demonstrate that your code has met the 
> requirements set forth in this document, you cannot deploy your product. For most 
> others, the criteria are less fixed.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** product specification and requirements, mission-critical software

---

> memory sub system in the 
> target and is not suit able for 
> initial hardware/software 
> integration 
> Not real time, so 
> system performance will differ 
> with a debugger present 
> Difficulty in running 
> out of ROM- based memory 
> because you can’t sin gle step 
> or insert breakpoints 
> Requires that the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> 25. 
>  Douglass, Bruce Powel. “UML for Systems Engineering.” Computer 
> Design, November 1998, 44.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** systems engineering

---

> you need the run control feature set that the debugger provides because 
> examining and modifying memory and registers, single- stepping, and running to 
> breakpoints is fundamental to debugging software of any kind. You can use these

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** run control and breakpoints

---

> target PC board. Figure 7.2
>  shows the pinout for the BDM debug interface.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** bdm interface

---

> methodology. 
> Figure 7.8
>  shows the basic structure of the Nexus interface.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** nexus interface

---

> keyed on several interrupt service routines (ISRs) and, using its hyperlink and 
> code generation facility, created some alternative code segments for the old CISC 
> code.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test data generation strategies

---

> microprocessor vs. microcontroller 24
>   
> microprogrammer 105
>   
> MIPS 26
>   
> modified condition decision coverage 198
>   
> modifying memory 116

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** condition coverage

---

> post-processing 132

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** trace post-processing and reconstruction

---

> Halting Theorem 186
>   
> hard real-time 196
>   
> hardware 
> breakpoint 173
>   
> instability 150
>   
> manipulating 89
>   
> reconfigurable 209
> , 212–213, 225  
> simulation 60
>   
> trends 50
>   
> hardware/simulation 196
>   
> hardware/software 
> duality 48
>   
> partition 2
> , 7  
> hardware-assist xxvi
>   
> heap 72
>   
> hazzards 81
>   
> host-based debugging 112
>   
> I  
> I/O 
> address space 89
>   
> in C 89

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, hardware-assisted measurement

---

> Although we had the latest tools at our disposal, we lacked a way to “back 
> annotate” our design so that corrections made downstream would be reflected in 
> the higher-level design documents. Back annotation is a common practice in 
> Electronic Design Automation (EDA) circles. Hardware designers, both IC and 
> board- level, routinely back annotate their designs to reflect lower-level changes at 
> the higher design layers. This capability, at least in an automated form, is still

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test automation, electronic design automation (eda)

---

> Systems Programming, August 1999, 71. 
>  Kohler, Mark. “NP Complete.” Embedded Systems Programming, 
> November 2000, 45. 
>  Leteinurier, Patrick and George Huba. “32-bit MCUs Gain Ground in 
> Auto Control.” Electronic Engineering Times, 17 April 2000, 92. 
>  Turley, Jim. “Choosing an Embedded Microprocessor.” Computer Design, 
> March 1998, 6. 
>  Turley, Jim. “Adapting to Bigger, Faster Embedded RISC.” Computer 
> Design, May 1998, 81.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** systems engineering, control systems engineering

---

> Real-Time Operating System Checklist 
> avail able for your RTOS? How much effort will be required to integrate them? 
>  　 
> Device Drivers
>   
> If you’re using common hardware, are device drivers available for your RTOS? 
>  　 
> Debugging Tools
>   
> RTOS vendors may have debugging tools that help find defects that are much 
> harder to find with standard source-level debuggers. 
>  　 
> Standards 
> Compatibility  
> Are there safety or compatibility standards that your application demands? Make

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, cost of defects

---

> could overcome this problem was the ICE. 
>  
> Background Debug Mode 
> BDM is Motorola’s proprietary debug interface. Motorola was the first embedded 
> processor vendor to place special circuitry in the processor core with the sole 
> function of processor debugging. Thus, BDM began the trend to on-chip debug 
> resources. Today, embedded processors or microcontrollers are expected to have 
> some kind of dedicated, on-chip debugging circuitry. The hardware design need

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** bdm interface, on-chip debug resources

---

> List of Tables 
> Chapter 2: The Selection Process 
> Table 2.1: EEMBC tests list.  
> Table 2.2:
>  Real-time operating system checklist. [4]  
> Chapter 4: The Development Environment 
> Table 4.1: Linker commands.  
> Chapter 6: A Basic Toolset 
> Table 6.1: Advantages/disadvantages of the debug kernel.  
> Table 6.2:
>  Advantages/disadvantages of ROM emulator.  
> List of Listings 
> Chapter 4: The Development Environment 
> Listing 4.1: Example of a linker command file. (from Microtec Research, Inc.).

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** processor selection process, real-time systems

---

> Unfortunately, the environmental constraints are often left to the very end of the 
> project, when the product is in testing and the hardware designer discovers that 
> the product is exceeding its thermal budget. This often means slowing the clock, 
> which leads to less time for the software to do its job, which translates to further

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> active interest in the selection process. Second, software and tool support must be 
> an important part of the decision. The entire design team (including the software 
> designers) must be involved in the selection because they are the ones who feel 
> the pressure from upper management to “get that puppy out the door.” If the task 
> of selecting the best processor for the job is left to the hardware designers with 
> little consideration of the quality of the software and support tools, it might not

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** processor selection process, fault tolerance considerations

---

> debug kernel features to trace program execution but not without intruding on the 
> real-time behavior of the system. The logic analyzer, although more expensive, 
> provides a less intrusive means of tracing program execution. 
> This chapter has considered the three fundamental tool requirements for 
> integrating hardware and software: 
>  A debug kernel for controlling the processor during code development 
>  Substitution memory as a way to rapidly download and replace code

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, logic analyzer tracing

---

> in that 16KB block have been accessed by the user’s program code. 
> aOverlay memory completes the design of the generic emulator. In contrast to the 
> individual tools described in earlier chapters, the emulator offers: 
>  A single connection to the target board 
>  Reliable run control even in unreliable systems 
>  Cross-triggering of the run control system, allowing trace and 
> breakpoint facilities to work together 
>  Real-time monitoring of illegal memory accesses

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** trace-triggering and cross-triggering, real-time systems

---

> Verilog simulation). The formal process is called co- design and co-verification. The 
> names are often used interchangeably, but there is a formal distinction. Co-design 
> is the actual process of developing the hardware and controlling software together. 
> Co-verification tends to focus on the correctness of the hardware/software 
> interface. 
>  
> To understand how the co-design system works consider Figure 3.6
> .

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** hardware/software co-design, hardware/software co-verification

---

> find that the system locks up about every 20 hours of testing. You examine the 
> T
> E
> A
> M
> F
> L
> Y
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
>  
> Team-Fly
> ®

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** system testing

---

> used, together with the VHDL or Verilog representation of the hardware, to create 
> a virtual test platform. This virtual hardware could be exercised by the actual 
> embedded software, rather than artificially constructed test vectors. This would 
> allow the traditional hardware/software integration phase to be moved earlier in 
> the process (or even eliminated). 
> For the hardware developer, this would certainly enhance the hardware/software

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> whether it really understood the hardware specification document provided by the 
> hardware team. 
>  
> Big Endian/Little Endian Problem 
> One of my favorite integration discoveries is the “little endian/big endian” 
> syndrome. The hardware designer assumes big endian organization, and the 
> software designer assumes little endian byte order. What makes this a classic 
> example of an interface and integration error is that both the software and

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> Systems.” Computer Design, November 1998, 53. 
>  Pacheco, Sylvia. “UML Delivers Real-Time Software Standardization.” 
> Real Time Computing, March 2000, 87. 
>  Varhol, Peter. “Front-End Design Automation for Building Complex 
> Systems.” Computer Design, July 1998, 87. 
>  Varhol, Peter. “New Designs Model Complex Behavior.” Electronic 
> Design, 21 February 2000, 79. 
> Summary 
> More than anything else, the need to “work on the metal” differentiates embedded

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, test automation

---

> He told them of one IME customer in Asia who was having problems optimizing a 
> compression algorithm for a photographic-image scanner. The algorithm was sent 
> to IME for analysis by the IO Lab. Their simulations showed that it should be 
> running in one-fifth of the time. IME shipped out a loaner software performance 
> analyzer with real-time profiling capability built-in. The IME-Singapore FAE flew out 
> to the plant and set up the analyzer to gather software performance data on that

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** customer research tour, real-time systems

---

> computers that use the target micro processor. These single-board computers are 
> often referred to as evaluation boards because they evaluate the performance of 
> the microprocessor by running test code on it. The evaluation board also provides 
> a convenient software design and debug environment until the real system 
> hardware becomes available.  
> You’ll learn more about this stage in later chapters. Just to whet your appetite,

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** evaluation boards and single-board computers

---

> windshield wipers, and headlights are all turned on simultaneously? Does it lock up 
> when those items are turned on rapidly in a certain order? What if the radio is 
> turned on and off rapidly 100 times in a row? 
> In every real-time system, certain combinations of events (call them critical 
> sequences) cause the greatest delay from an event trigger to the event response. 
> The embedded test suite should be capable of generating all critical sequences and 
> measuring the associated response time.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, critical event sequences

---

> the underlying hardware as early as possible. Ideally, you could remove the “over 
> the wall” issues and have a design process that continually exercises the hardware 
> and software against each other from creation to release. 
> Figure 3.4
>  shows how the earlier introduction of hardware/software integration 
> shortens the design cycle time. Much of the software development time is spent 
> integrating with the hardware after the hardware is available.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> Introduction 
> The arrival of the microprocessor in the 1970s brought about a revolution of 
> control. For the first time, relatively complex systems could be constructed using a 
> simple device, the microprocessor, as its primary control and feedback element. If 
> you were to hunt out an old Teletype ASR33 computer terminal in a surplus store 
> and compare its innards to a modern color inkjet printer, there’s quite a difference.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** control systems and feedback control

---

> Because black-box tests depend only on the program requirements and its I/O 
> behavior, they can be developed as soon as the requirements are complete. This 
> allows black-box test cases to be developed in parallel with the rest of the system 
> design.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test case design

---

> Chapter 3 - The Partitioning Decision 
>  
> Chapter 4 - The Development Environment 
>  
> Chapter 5 - Special Software Techniques 
>  
> Chapter 6 - A Basic Toolset 
>  
> Chapter 7 - BDM, JTAG, and Nexus 
>  
> Chapter 8 - The ICE — An Integrated Solution 
>  
> Chapter 9 - Testing 
>  
> Chapter 10 - The Future 
>  
> Index  
>  
> List of Figures  
>  
> List of Tables  
>  
> List of Listings  
>  
> List of Sidebars  
>  
> T
> E
> A
> M
> F
> L
> Y

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> Chapter 7: BDM, JTAG, and Nexus 
> Overview 
> Traditionally, the debug kernel has been implemented in firmware. Thus, for the 
> kernel to execute correctly on new hardware, the new design must at least get the 
> processor–memory interface correct. Unfortunately, as clock speeds increase and 
> memory systems grow in size and complexity, this interface has become more and 
> more demanding to engineer, which raises a question “how you can debug the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** bdm interface, nexus interface

---

> memory image in order to completely track the real-time execution of the code. 
> Notice how codes are provided for change-of-flow instructions, such as 0101 for 
> the execution the first instruction after a taking branch and 1100 for entry into an 
> exception handler.  
> A complete discussion of the behavior of the PST3-PST0 pins would quickly drive 
> all but the most dedicated readers into “geek overload”, so I’ll end my discussion

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, exception testing

---

>  Lower RF signature — Fast signals don’t radiate from a large PC board.  
> Thus, it’s obvious why microcontrollers have become so prevalent and even 
> dominate the entire embedded world. Given that these benefits derive directly 
> from the higher integration levels in microcontrollers, it’s only reasonable to ask 
> “why not integrate even more on the main chip?” A quick examination of the 
> economics of the process helps answer this question.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> implies testing every possible combination of inputs or every possible decision path 
> at least once. This is a noble, but utterly impractical, goal. For example, in The Art 
> of Software Testing, Glen Ford Myers[6] describes a small program with only five 
> decisions that has 10
> 14
>  unique execution paths. He points out that if you could 
> write, execute, and verify one test case every five minutes, it would take one

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> chosen based on a guess about what errors are likely. This testing strategy is 
> useful when you’re integrating new functionality with a stable base of legacy code. 
> Because the code base is already well tested, it makes sense to focus your test 
> efforts in the area where the new code and the old code come together. 
> Testing Embedded Software 
> Generally the traits that separate embedded software from applications software 
> are:

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> integration in one continuous process. These tools will allow designers to delay 
> many partitioning decisions until the impact can be explored using virtual 
> hardware. 
> Whether it’s sociological or traditional, embedded systems designers tend to draw 
> a sharp distinction between the designers of hardware and the designers of 
> software. Justified by this distinction, organizations have imposed varying degrees 
> of separation between the teams. In an extreme case, the hardware might be built

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> processor-performance measuring and code- quality testing. These topics are 
> discussed in more detail in Chapter 9
> , so they are only introduced here. 
> Statistical Profiling 
> Suppose that instead of waiting for a trigger event, you tell the logic analyzer to 
> capture one buffer full of data. If the logic analyzer is connected to a PC, you can 
> write a fairly simple C program that randomly signals the logic analyzer to start

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** performance testing, random testing

---

> block — and by implication all the statements in the block — are executed. This 
> kind of software-based logging can be an extremely efficient way to measure 
> statement coverage. 
> Of course, printf() statements slow the system down considerably, which is not 
> exactly a low-intrusion test methodology. Moreover, small, deeply embedded 
> systems might not have any convenient means to display the output (many 
> embedded environments don’t include printf() in the standard library).

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** statement coverage, low-intrusion logging

---

> opportunity to be exposed to the actual hardware issues of embedded systems 
> design. Some issues are worth mentioning, and I’ll cover these as necessary. 
>  
> Hardware/Software Integration 
> The hardware/software integration phase of the development cycle must have 
> special tools and methods to manage the complexity. The process of integrating 
> embedded software and hardware is an exercise in debugging and discovery. 
> Discovery is an especially apt term because the software team now finds out

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> team usually spends a minimal amount of time and energy creating this 
> throwaway code. Extensive software-to-hardware interface testing doesn’t begin 
> until real hardware is available, which is a lost opportunity. The later you are in a 
> project when a defect is discovered, whether it is a hardware defect or a software 
> defect, the more expensive it is to fix as illustrated in Figure 3.3
> .  
>  
> Figure 3.3: Where design time is spent.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> Figure 3.4: Shortening the design cycle.  
>  
> Schematic representation of the embedded design cycle showing the 
> advantage of earlier integration of the software under development with 
> the virtual hardware also under development.  
>  
>  
> The ASIC Revolution 
> Silicon compilation provided much more than a way for CPU designers to design 
> better microprocessors and microcontrollers. Everyone who wanted to design an IC 
> for any purpose could do so. Suddenly, anyone could design an IC that was

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> to support a typical development environment, and even when it does, it’s likely to 
> be running a minimal (or even custom) operating system supported by few, if any, 
> tool vendors. 
> Thus, system integration requires special tools: tools that (mostly) reside on the 
> development platform but that allow the programmer to debug a program running 
> on the target system. At a minimum these tools must: 
>  
>  Provide convenient run control for the target

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> similar testing effort in software. At Microsoft, for example, the ratio of 
> development engineers to test engineers is close to one. 
> Before submitting the design to the foundry, the hardware designer uses the test 
> vectors to run the design in simulation. Several companies in the business of 
> creating the electronic design tools needed to build SoS provide Verilog or VHDL 
> simulators. These simulators exercise the Verilog or VHDL design code and use the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> billion years to test exhaustively this program. Obviously, the ideal situation is 
> beyond reach, so you must use approximations to this ideal. As you’ll see, a 
> combination of functional testing and coverage testing provides a reasonable 
> second-best alternative. The basic approach is to select the tests (some functional, 
> some coverage) that have the highest probability of exposing an error. 
> Functional Tests 
> Functional testing is often called black-box testing because the test cases for

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> consistent theme, “We won’t let you fail. IME stands behind the performance of 
> these tools. All the tools in the recommended tool chain work together with 
> seamless integration through SDI. We are fully SDI-compliant.” 
> Three months later 
> The pizza coupons were finally used up. Ralph joked that they needed another IME 
> presentation to refresh their coupon supply. 
> The first cut of PC boards had come back, and Sue was busy powering them up.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> safety-critical 186
>   
> stress 191
>   
> stub code 49
>   
> unit 188
>   
> vectors 60
>   
> white-box 189
> , 192  
> See also white-box tests
>   
> threads 99
>   
> time 
> to insight 19
>   
> to market 19
> , 42, 207  
> to money 43
> , 220  
> time-critical ISR 101
>   
> timer 
> watchdog 
> See watchdog timer
>   
> timing 
> margin 178
>   
> specification 178
>   
> tools 38
>   
> business issues 214
> , 220–224  
> debugging 36
> , 40  
> partitioning 49
>   
> product specification 6
>   
> RTOS compatibility 34
>   
> trace 
> buffer 143
>   
> low-intrusion 197

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** safety-critical systems, low-intrusion logging

---

> up my work. I started to type but was faced with the hourglass symbol because 
> the computer was busy doing other things. Suppose my computer wasn’t sitting on 
> my desk but was connected to a radar antenna in the nose of a commercial jetliner. 
> If the computer’s main function in life is to provide a collision alert warning, then 
> suspending that task could be disastrous. 
>  
> Real-time constraints generally are grouped into two categories: time- sensitive

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems

---

> design environment as they progressed from design to coding, they just wrote 
> code as usual. We took a lot of heat from management because progress was 
> viewed as code being written, not time spent in design and specification. The big 
> payback came when we integrated the hardware and the software. The process 
> went incredibly well. Similar projects had spent two to six months in the HW/SW 
> integration phase. We were essentially done in two weeks.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> another one-or-two week project just to modify your target system so you can use 
> an emulator to find the problem. 
> Even if you don’t plan to make the emulator a primary integration tool, you should 
> design for the possibility. That way, when you encounter that project-killing bug, 
> you’ll at least have the option of “bringing in the big guns.” These are my 
> suggestions: 
> Design for emulation. In other words, design with your development tools in

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> few projects turned in that didn’t work because the student made a minor change 
> at 4:00AM on the day it was due, and the project suddenly unraveled. But, hey, 
> what do I know? 
>  
>  
> When to Test? 
> It should be clear from Figure 9.1 that testing should begin as soon as feasible. 
> Usually, the earliest tests are module or unit tests conducted by the original 
> developer. Unfortunately, few developers know enough about testing to build a

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

>  Communications Algorithms for Im46K Designers 
>  Conversion Software for RISC-Based Systems 
>  Im46K Design and Integration Tools, for Evaluation 
>  CASE Tools for Embedded Systems Design 
>  Im46K Hardware Design Guide 
> A full set of traditional manuals was included, as well as six sets of volumes I, II, 
> and III of Dr. Jerry Flemming’s book, Programming the Im46K RISC Family. Sue 
> also found a book of coupons for free pizzas from ComDelta’s favorite take-out

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> sleep mode xxi  
> SoC 55
> , 60, 209  
> socket adapter 172
>   
> software 
> architecture 14
>   
> interrupt xxiv
> , 116  
> mission-critical 186
>   
> safety-critical 186
>   
> SOS 
> See SoC
>   
> source module 83
>   
> SP 73–74
>   
> specifications 
> product 4–7
>   
> timing 178
>   
> SPECmark 31
>   
> speed vs density 95
>   
> S-Record 87
>   
> stack 70–71
> , 73, 75, 90  
> depth checking 103
>   
> frame 71
> , 77, 91  
> location 71
>   
> overflow 73
>   
> pointer 73
>   
> protocol 90
>   
> startup 
> code 39
> , 78–80  
> vector 78
>   
> state 
> modes 131

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** mission-critical software, safety-critical systems

---

> truly captures all of the subtleties of the embedded development process, 
> representing it as a parallel development of hardware and software, followed by an 
> integration step, seems to capture the essence of the process. 
>  
> What do I expect you to know? 
> Primarily, I assume you are familiar with the vocabulary of application 
> development. While some familiarity with C, assembly, and basic digital circuits is 
> helpful, it’s not necessary. The few sections that describe specific C coding

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> are packaged as separate ICs. In a microcontroller-based system many, if 
> not all, of the I/O functions are integrated into the same package with the 
> CPU.  
> The advantages of the microcontroller’s higher level of integration are easy to see: 
>  
>  Lower cost — One part replaces many parts. 
>  More reliable — Fewer packages, fewer interconnects. 
>  Better performance — System components are optimized for their 
> environment. 
>  Faster — Signals can stay on the chip.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> course, the bug in the software can be a defect in the hardware design description, 
> as well as a defect in the control code. However, consider the implications of a 
> defect that is discovered during the hardware/software integration phase. If the 
> defect was in the “traditional” software, you fix the source code, rebuild the code 
> image, and try again. You expect this because it is software! Everyone knows there 
> are bugs in software. 
>  
> From the Trenches

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> time software developers is the lack of measurements of execution time. Follow his 
> steps to avoid the same trap: 
>  First, design your system so that the code is measurable! 
>  Measure execution time as part of your standard testing. Do not only 
> test the functionality of the code! 
>  Learn both coarse-grain and fine-grain techniques to measure 
> execution time. 
>  Use coarse-grain measurements for analyzing real-time properties. 
>  Use fine-grain measurements for optimizing and fine-tuning.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time systems, system testing

---

> program is correct. Given the right test, however, you can prove that a program is 
> incorrect (that is, it has a bug). It’s important to remember that testing isn’t about 
> proving the “correctness” of a program but about finding bugs. Experienced 
> programmers understand that every program has bugs. The only way to know how 
> many bugs are left in a program is to test it with a carefully designed and 
> measured test plan. 
> To Reduce Risk

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> From the Trenches  For the longest time, my PC had a nagging problem of 
> crashing in the middle of my word processor or graphics 
> application. This problem persisted through Windows 95, 
> 95 Sr-1, 98, and 98 SE. After blaming Microsoft for 
> shoddy software, I later discovered that I had a hardware 
> problem in my video card. After replacing the drivers and 
> the card, the crashes went away, and my computer is 
> behaving well. I guess hardware/software integration

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> In many companies, the job of testing the embedded product goes to a separate 
> team of engineers and technicians because asking a designer to test his own code 
> or product usually results in erratic test results. It also might lead to a “circle the 
> wagons” mentality on the part of the design team, who view the testers as a 
> roadblock to product release, rather than equal partners trying to prevent a 
> defective product from reaching the customer.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> separate I/O address space and the device is port mapped, you have no choice but 
> to “drop down” to assembly to perform the actual manipulation; this is because C 
> has no intrinsic notion of “ports.” Some C compilers provide special CPU-specific 
> intrinsic functions, which are replaced at translation time by CPU-specific assembly 
> language operations. While still machine-specific, intrinsic functions do allow the 
> programmer to avoid in-line assembly. Things are much simpler if the device is

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** in-line assembly and intrinsic functions

---

> was lit. 
> There are all sorts of disciplined ways our designers could 
> have avoided this problem. They might have taken the 
> lead of the ASIC designers and allotted 50% of their total 
> design time to creating simulation scenarios (called test 
> vectors) so they could fully exercise the FPGA design in 
> simulation, rather than in the target board. The reason 
> ASIC designers spend so much time testing is that one 
> failure could mean an ASIC re-spin costing thousands of

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> application code. 
> If the PC did not have an FPU, the application code had to trap the floating-point 
> instructions and execute an exception or trap routine to emulate the behavior of 
> the hardware FPU in software. Of course, this was much slower than having the 
> FPU on your motherboard, but at least the code ran. 
> As another example of hardware/software partitioning, you can purchase a modem 
> card for your PC that plugs into an ISA slot and contains the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** hardware/software partitioning, exception testing

---

> Host-Based Debugging 
> Although you can do a certain amount of testing on your desktop PC, unless you 
> are lucky enough to be programming for an embedded PC, eventually differences 
> between the desktop hardware and the target hardware will force you to move the 
> testing to the target. 
> If you write your applications in C or C++, you should be able to debug an 
> algorithm on the host (as long as you watch out for a few minor differences that

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> environment early on, it gives the team the opportunity to gain valuable 
> experience with the debugging and integration tools that have been selected for 
> use later in the process. The RTOS, debug kernel, performance tools, and other 
> components of the design suite also can be evaluated before crunch time takes 
> over. 
>  
> RTOS Availability 
>  
> Choosing the RTOS — along with choosing the microprocessor — is one of the 
> most important decisions the design team or system designer must make. Like a

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> to the target system? Some target systems need to see bus activity, or they will 
> generate an NMI or RESET signal. Others use dynamic RAM (DRAM) memory and 
> need to see these signals to retain their memory contents. 
> Understand the real-time constraints. Do you have watchdog timers or other 
> real-time events that must be serviced for the system to run? The emulator might 
> work just fine, but it can crash the target if it isn’t used in the proper mode.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** real-time constraints, real-time systems

---

> ROM space they had. Thus, you can see how coverage testing can provide you with 
> clues about where you can excise code that does not appear to be participating in 
> the program. Although removing dead code probably won’t affect the execution 
> time of the code, it certainly will make the code image smaller. I say probably 
> because on some architectures, the dead code can force the compiler to generate 
> more time-consuming long jumps and branches. Moreover, larger code images and

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> C  
> C run-time 78  
> cache 95
> , 139–140  
> D-cache 139
>   
> hit 101
>   
> I-cache 139
>   
> performance 204
>   
> traceable 140
>   
> triggering 141
>   
> CASE tools 107
>   
> cast 92
>   
> checksum 
> ROM 78
>   
> chip vendors 
> and tools 220–224
>   
> CMOS xxii
>   
> code 
> coverage 144
>   
> density vs speed 95
>   
> generation 39
>   
> optimization 80
> , 93  
> patches 14
>   
> placement 82
>   
> quality 144
>   
> section 84
>   
> size 
> bloat 106
>   
> reducing size 80

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test data generation strategies

---

> system when you can’t rely on the system to execute even the debug kernel?” 
> Increasing levels of integration create a related problem: How do you modify 
> firmware when it’s embedded on a chip in which you can’t use a ROM emulator? 
> To address these and other related issues, chip vendors are beginning to supply 
> hardware implementations of the debug kernel as part of the chip circuitry. When 
> the functionality of the debug kernel is part of the chip circuitry, debugging tools

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> The software team had ported most of the code that they wanted to re-use, 
> stubbed-out the new code, and were waiting for real hardware to run it on. They 
> found the development environment to be everything that IME had promised. 
> Using the software simulator, along with the evaluation boards, they had most of 
> the new software ready for real hardware. The OS had been configured using the 
> RTOS-check software, and the team was pretty confident that the integration 
> phase was under control.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

>  Startup code — Does the compiler include the assembly language code 
> needed to establish the C run-time environment? This is the code that 
> goes from RESET and ends with a JSR to main(). 
>  RTOS support — Are your choices of compiler and RTOS compatible? 
>  Tools integration — Is your compiler choice compatible with the other 
> tools (make utility, debugger, and so on) that you plan to use? 
>  Optimizations — Does the compiler support optimizations for speed and 
> code size?

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> plus because I/O pins are a precious resource on a cost-sensitive device, such as 
> an embedded microprocessor. Note that the JTAG pin definition includes both TDI 
> and TDO pins. Thus, the data stream can enter the CPU core and then exit it to 
> form a longer loop with another JTAG device. Also, unlike BDM, the JTAG interface 
> is an open standard, and any processor can use it. However, the JTAG standard 
> only defines the communications protocol to use with the processor. How that

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** cost-sensitive design, bdm interface

---

> to be a tightly inte grated method of doing just that. Suppose, we argue, you 
> break the ICE apart into its component pieces and then use them independently. 
> By doing that, you lose the tight integration but gain because you can use more 
> generic and cost-effective tools in place of the ICE. This argument cer tainly has 
> merit. In fact, devious to fault, I made that argument in the previous chapter
> . 
> However, as with most engineering endeavors, we have trade-offs that must be

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> into the basic blocks, DC also measures the results of decision points in the code, 
> such as looking for the result of binary (true/false) decision points. In C or C++, 
> these would be the if, for, while, and do/while constructs. DC has the advantage 
> over statement coverage of being able to catch more logical errors. For example, 
> suppose you have an if statement without an else part  
> if (condition is true) 
> { 
> < then do these statements>; 
> } 
> < code following elseless if >

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** statement coverage, condition coverage

---

> Chapter 1: The Embedded Design Life 
> Cycle 
> Unlike the design of a software application on a standard platform, the design of 
> an embedded system implies that both software and hardware are being designed 
> in parallel. Although this isn’t always the case, it is a reality for many designs 
> today. The profound implications of this simultaneous design process heavily 
> influence how systems are designed. 
> Introduction

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle

---

> connected to the address bus. The two microprocessors then run in lockstep. The 
> unconnected address pins of the slave processor output the current value of the 
> program counter on every instruction cycle. These additional states are captured 
> by the logic analyzer, and, by post-processing the resulting trace, the actual 
> instruction flow can be reconstructed, even though the processor is running out of 
> the cache.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** trace post-processing and reconstruction

---

> strategy. He went over the philosophy of System Debug Interface (SDI) and how it 
> allowed a seamless integration of tools for the design team. Mike, a graying hippie-
> type with a long ponytail was particularly acerbic. “I’ve seen that story a bazillion 
> times already. It’s the holy grail of embedded design. Why should I believe that 
> you guys got it when every booth at the Embedded Systems Conference has a 
> bunch of Marketing types in Polo™ shirts telling me that they have the inside track

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** rtos integration, integration testing

---

> Overlay Memory 
> Even though triggered breakpoints work on code located in ROM, you still need 
> some kind of substitution memory, if for no other reason than to speed up the 
> edit–compile–link–load–debug cycle. Chapter 6
>  covered the ROM emulator, a 
> device that plugs into the ROM sockets and replaces the ROM, while providing an 
> easy method of downloading code through an Ethernet or serial port. You could do 
> that here as well. This is called substitution memory because it’s used to substitute

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** overlay memory and memory substitution

---

> shared data and concurrency. Similarly, the programmers implementing that 
> design must fully understand those issues and the use of correct use of critical 
> sections, semaphores, interprocess communication, and more.  
> Moreover, any RTOS must be customized, to some degree, for the target 
> environment that it will be supervising. Typically, this involves developing the 
> board support package (BSP) for the operating system and the target. This could

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** board support package (bsp)

---

> Summary 
> In a way, it’s somewhat telling that the discussion of testing appears at the end of 
> this book because the end of the product development cycle is where testing 
> usually occurs. It would be better to test in a progressive manner, rather than 
> waiting until the end, but, for practical reasons, some testing must wait. The 
> principal reason is that you have to bring the hardware and software together 
> before you can do any kind of meaningful testing, and then you still need to have

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> code but are unable to find the root cause of the error. Should you ship the 
> product? 
> How much testing is “good enough”? I can’t tell you. It would be nice to have 
> some time-tested rule: “if method Z estimates there are fewer than X bugs in Y 
> lines of code, then your program is safe to release.” Perhaps some day such 
> standards will exist. The programming industry is still relatively young and hasn’t 
> yet reached the level of sophistication, for example, of the building industry. Many

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** unit testing, stress testing

---

> areas of the processor’s address space, rather than look at the target system 
> through the ROM socket. 
> Overlay memory is extremely useful. In fact, it’s much more useful than 
> substitution memory. Overlay memory uses the same trick that is used with 
> shadow memory. On a bus cycle-by-bus cycle basis, fast buffers and steering logic 
> are used to decide to which block of memory the processor actually connects. The 
> block of memory can exist on the target, in shadow memory, or in overlay memory.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** overlay memory and memory substitution

---

> provided by the processor. With these systems, it’s sometimes possible to obtain 
> an accurate picture of the true execution coverage by post-processing the raw 
> trace. Still, the problem remains that the data capture and analysis process is 
> statistical and might need to run for hours or days to produce a meaningful result. 
> In particular, it’s difficult for sampling methods to give a good picture of ISR test

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** trace post-processing and reconstruction

---

> Figure 6.13: Display with interleaved source code.  
>  
> Screen capture of a logic analyzer state trace with C source statements 
> and the corresponding assembly language instructions inserted in the 
> trace display.  
> The trace now gets much busier than before, but at least you can raise the 
> abstraction level of the debugging to something more appropriate than individual 
> machine clock cycles. By post-processing the raw trace, either on the host or in

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** trace post-processing and reconstruction

---

> code is their most important task. 
> It is an unfortunate truth of embedded systems design that few, if any, tools have 
> been created specifically to help engineers in the maintenance and upgrade phases 
> of the embedded life cycle. Everyone focuses on new product development. Go to 
> any Embedded Systems Conference™, and every booth is demonstrating 
> something to help you improve your time to market. What if you’re already in the

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle

---

> designs, few, if any, tools are available to help these designers reverse-engineer 
> the product to make improvements and locate bugs. The tools used for 
> maintenance and upgrading are the same tools designed for engineers creating 
> new designs. 
>  
> The remainder of this book is devoted to following this life cycle through the step-
> by-step development of embedded systems. The following sections give an 
> overview of the steps in Figure 1.1
> . 
>  
> Product Specification

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle

---

> Compress JPEG RGB-to-CMYK conversion 
> Decompress JPEG RGB-to-YIQ conversion 
> High-pass grayscale filter 
>   
> Networking Suite  
> OSPF/Dijkstra routing Packet Flow (1MB) 
> Lookup/Patricia algorithm Packet Flow (2MB) 
> Packet flow (512B) 
>   
> Office Automation Suite  
> Bezier-curve calculation Image rotation 
> Dithering                                                   Text                                                   processing

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test automation

---

> language instructions they generate, exactly as the processor would 
> execute them. This feature is useful for manual code generation (and 
> low-level debugging). 
>  Standard libraries — Many of the standard library functions that you 
> expect to be included with your compiler are not part of standard C or 
> C++; they might not be included with your compiler. This is particularly 
> true of cross compilers, which are designed to be used with embedded

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test data generation strategies

---

> emulators, even though they were the tools of choice for difficult debugging 
> problems. 
> The development tools requirements should be part of the product specification to 
> ensure that unreal expectations aren’t being set for the product development cycle 
> and to minimize the risk that the design team won’t meet its goals.  
>  
> Tip  One of the smartest project development methods of which I’m 
> aware is to begin each team meeting or project review meeting by

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** product specification and requirements

---

> important. If you don’t select the right tools up front, when design decisions also 
> are being made, debugging your design might take so long that the product will 
> miss its market window. If you miss Comdex and are unable to show off your next 
> generation of laser printer, for example, it might not be worth your while to 
> continue the product development. 
> Multiprocessor designs are perfect examples of the necessity for debug strategies.

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test data generation strategies

---

> between different tasks in your system? Are the data transfer rates generally equal, 
> or are there variations in the rate of data generation and the rate of information 
> consumption. If the data transfer rates are seriously mismatched, then you might 
> need a message queue structure and a first-in, first-out (FIFO) buffer to level the 
> loads. Conversely, you don’t want to pay for complexity you don’t need so 
> scalability is also important. 
> Tool Chain Availability

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test data generation strategies

---

>  Interrupt function — The inclusion of the nonstandard keyword 
> interrupt when used as a type specifier tells the compiler that this 
> function is an interrupt service routine (ISR). The compiler then 
> generates the extra stack information and registers saves and restores 
> that are part of any ISR you write in assembly language. 
>  Assembly language list file generation — The assembly language list file 
> contains C statements interspersed as comments with the assembly

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** test data generation strategies

---

> development tools required to design the product. Figure 1.2
>  shows the embedded 
> life cycle from a different perspective. This “design tools view” of the development 
> cycle highlights the variety of tools needed by embedded developers. 
> When I designed in-circuit emulators, I saw products that were late to market 
> because the engineers did not have access to the best tools for the job. For 
> example, only a third of the hard-core embedded developers ever used in-circuit

**Categories:** embedded systems engineering, real-time systems and control, software engineering for constrained systems, hardware architecture and vlsi design, systems design methodology, software testing and verification, real-time systems engineering
**Concepts:** embedded design life cycle

---

### Embedded C

*File: Embedded C.pdf*

> 9.4The basic RS-232 protocol218
> 9.5Asynchronous data transmission and baud rates219
> 9.6Flow control220
> 9.7The software architecture220
> 9.8Using the on-chip UART for RS-232 communications222
> 9.9Memory requirements224
> 9.10    Example: Displaying elapsed time on a PC225
> 9.11    The Serial-Menu architecture237
> 9.12    Example: Data acquisition237
> 9.13    Example: Remote-control robot252
> 9.14    Conclusions253
> 10   Case study: Intruder alarm system255
> 10.1  Introduction255

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** serial-menu interface, rs-232 serial communications, serial communication, asynchronous data transmission, rs-232 protocol, memory architecture, intruder alarm system case study

---

> ‘design patterns’ to support the development of embedded systems based on the
> 8051 family of microcontrollers. In total, details of more than 70 useful patterns
> are provided, complete with guidelines to help you apply these techniques in your
> own projects: full source code for all of the patterns is included on the PTTES CD.
> The book includes: patterns for embedded operating systems (for both single-
> processor and multi-processor applications); patterns for user-interface designs

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, design patterns for embedded systems, multi-processor embedded systems, design patterns for embedded applications, device driver development

---

> 7.4  Using Timer 0 or Timer 1161
> 7.5  Is this approach portable?166
> 7.6  Alternative system architectures166
> 7.7  Important design considerations when using sEOS172
> 7.8  Example: Milk pasteurization174
> 7.9  Conclusions187
> 8   Multi-state systems and function sequences189
> 8.1  Introduction189
> 8.2  Implementing a Multi-State (Timed) system192
> 8.3  Example: Traffic light sequencing192
> 8.4  Example: Animatronic dinosaur198
> 8.5  Implementing a Multi-State (Input/Timed) system204

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** function sequencing, multi-state (timed) systems, multi-state (input/timed) systems, multi-state systems

---

> Much of the activity in embedded systems involves reading pins (which may, for
> example, be connected to switches or keypads) and altering the value of other pins
> (which may, in turn, control anything, from an LED to a 5-tonne industrial robot).
> The 8051 architecture has a number of features which make it very well suited to
> such applications.
> Most 8051s have four 8-bit ports, giving a total of 32 pins you can individually

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, port pin reading, industrial control systems

---

> system certified for use, ensuring that the processing was ‘as fast as we could make
> it’ would not be enough to satisfy the relevant authorities: in this situation, as in
> many other real-time applications, the key characteristic is deterministicprocess-
> ing. What this means is that in many real-time embedded systems we need to be
> able to guaranteethat a particular activity will always be completed within (say) 2

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, real-time systems, signal processing

---

> it-yourself’ approach is typical in small embedded applications, where the memory
> requirements and expense of a desktop operating system (like Windows or Linux) or of
> a  so-called  ‘real-time  operating  system’  simply  cannot  be  justified.  However,  the
> approach is also in widespread use in large embedded systems (for example, aerospace
> applications or X-by-wire systems in the automotive industry), where conventional
> operating systems are generally considered to be too unpredictable.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, real-time systems, embedded linux

---

> 4.8Example: Reading switch inputs (basic code)70
> 4.9Example: Counting goats75
> 4.10    Conclusions80
> 5   Adding structure to your code81
> 5.1  Introduction81
> 5.2  Object-oriented programming with C82
> 5.3  The Project Header (MAIN.H)88
> 5.4  The Port Header (PORT.H)94
> 5.5  Example: Restructuring the ‘Hello Embedded World’ example96
> 5.6  Example: Restructuring the goat-counting example103
> 5.7  Further examples111
> 5.8  Conclusions111
> 6   Meeting real-time constraints113
> 6.1  Introduction113

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems, object-oriented style in c

---

> 10.2  The software architecture257
> 10.3  Key software components used in this example257
> 10.4  Running the program258
> 10.5  The software258
> 10.6  Conclusions283
> 11   Where do we go from here285
> 11.1  Introduction285
> 11.2  Have we achieved our aims?285
> 11.3  Suggestions for further study286
> 11.4Patterns for Time-Triggered Embedded Systems288
> 11.5Embedded Operating Systems288
> 11.6  Conclusions289
> Index291
> Licensing Agreement295
> xContents
> 8322 Prelims (i-xvi)  25/2/02  3:04 pm  Page x

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, patterns for time-triggered embedded systems

---

> VII   What’s the link between this book and your other 8051 book
> (Patterns for Time-Triggered Embedded Systems)?
> Embedded Cprovides an introduction to the use of C in embedded projects. If you
> want to learn more about embedded systems after you finish this book, then
> Patterns for Time-Triggered Embedded Systems(PTTES) may be of interest.
> 1
> PTTES  is  a  large  (1000-page)  book  which  includes  a  comprehensive  set  of

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, patterns for time-triggered embedded systems

---

> Please note that these simulators are not simply ‘toys’ to be used only when learn-
> ing how to develop embedded software. Even where hardware will be constructed,
> most developers will conduct early software tests on a simulator before using the
> hardware. This can greatly speed up the development process. For example, in
> applications using a serial interface (see Chapter 9), the simulator can determine
> the precise baud rate being generated by your software: this can avoid many sub-

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** hardware simulators for embedded software, device driver development

---

> ms: if the processing does not match this specification, then the application is not
> simply slower than we would like, it is useless. 
> 113
> chapter6
> Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 113

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems, signal processing

---

> interrupt  service  routines  (ISRs)  in  a  high-level  language  is  a  straightforward
> process, as illustrated in Listing 7.3.
> Listing 7.3    The framework of an application using a timer ISR to call functions on a
> periodic basis
> /*------------------------------------------------------------*-
> Main.c
> -------------------------------------------------------------
> Simple timer ISR demonstration program.
> -*------------------------------------------------------------*/
> #include <Reg52.H>

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** interrupt service routines (isrs), timer interrupts

---

> Michael J. Pontis an experienced software engineer who began his first embedded
> project  in  1986.  Since  then  he  has  lectured  and  carried  out  research  at  the
> University of Sheffield and the University of Leicester, and has provided consul-
> tancy and training services to a range of international companies. Michael is the
> author of two previous books Patterns for Time-Triggered Embedded Systemsand
> Software Engineering with C++ and CASE tools.
> About
> the author

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, patterns for time-triggered embedded systems

---

> address space. 
> Here the fact that it is an ‘8-bit microcontroller’ refers to the size of the registers
> and data bus. This means that the family will handle 8-bit data very quickly and
> process 16-bit or 32-bit data rather less efficiently.
> The 16-bit address space means that the device can directly address 2
> 16
> bytes of
> memory: that is, 64 kbytes. Note that the (Harvard-like) architecture of the 8051
> means that it can access both 64 kbytes of CODE memory and 64 kbytes of DATA

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** harvard-like architecture, 8051 microcontroller architecture, memory architecture

---

> If you have purchased a copy of this book, you are entitled to use the code
> listed in the text (and included on the CD) in your projects, should you choose
> to do so. If you use the code in this way, then no run-time royalties are due.
> xivPreface
> 1.  Pont, M.J. (2001) Patterns for time-triggered embedded systems: Building reliable applications with the
> 8051 family of microcontroller, Addison-Wesley / ACM Press.
> 8322 Prelims (i-xvi)  25/2/02  3:04 pm  Page xiv

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, patterns for time-triggered embedded systems

---

> NOTE: Both pins on the same port
> -*------------------------------------------------------------*/
> 61Reading switches
> 8322 Chapter 4 p57-80  21/2/02  9:55 am  Page 61

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** port pin reading

---

> 131Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 131

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems

---

> 133Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 133

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems

---

> -*------------------------------------------------------------*/
> 134Embedded C
> FIGURE 6.4Testing timeout loops: see text for details
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 134

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** timeout loops

---

> -*------------------------------------------------------------*/
> Listing 7.5    Part of a demonstration of sEOS running a dummy task
> /*------------------------------------------------------------*-
> Simple_EOS.C (v1.00)
> -------------------------------------------------------------
> Main file for Simple Embedded Operating System (sEOS) for 8051.
> Demonstration version with dummy task X(). 
> -*------------------------------------------------------------*/
> #include "Main.H"
> #include "Simple_EOS.H"

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** simple embedded operating system (seos)

---

> completely customized 8051 microcontroller, in order to match precisely your par-
> ticular requirements. 
> Overall, the low cost, huge range, easy availability and widespread use of the
> 8051 architecture makes it an excellent platform for developing embedded sys-
> tems:  these  same  factors  also  make  it  an  ideal  platform  for  learning  about
> embedded systems. Whether you will subsequently use 8-, 16- or 32-bit embedded

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, 8051 microcontroller architecture

---

> Learning to work on a ‘naked’ processor and create your own operating system are
> key requirements for software developers wishing to work with embedded systems.
> IV   What type of system is discussed?
> This book presents a number of examples adapted from working embedded sys-
> tems. These include:
> A remotely-controlled robot.
> A traffic-light sequencer.
> A system for monitoring liquid flow rates.
> A controller for a domestic washing machine.
> 8322 Prelims (i-xvi)  25/2/02  3:04 pm  Page xii

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, monitoring and control systems

---

> ‘Year 2000’ problem in recent years has illustrated, many embedded systems
> have a long lifespan. During this time, their code will often have to be main-
> tained. Good code must therefore be easy to understand now, and in five years’
> time (and not just by those who first wrote it). 
> To support these activities, we will do three things in this chapter:
> 1We will describe how to use an object-oriented style of programming with C

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, object-oriented style in c

---

> -*------------------------------------------------------------*/
> #include <Reg52.h>
> // Connect switch to this pin
> sbit Switch_pin = P1^0;
> // Display switch status on this port
> #define Output_port P3
> 71Reading switches
> 8322 Chapter 4 p57-80  21/2/02  9:55 am  Page 71

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** port pin reading

---

> Next, we load the timer registers with the initial timer value:
> 123Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 123

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems

---

> Timers like these are crucial to the development of embedded systems. To see
> why, you need to appreciate that, when configured appropriately, the timers are
> incremented periodically: specifically, in most 8051 devices, the timers are incre-
> mented every 12 oscillator cycles. Thus, assuming we have a 12 MHz oscillator,
> the timer will be incremented 1 million times per second.
> There are many things we can do with such a timer:

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, device driver development

---

> This type of embedded system is all around us. Use of embedded processors in pas-
> senger cars, mobile phones, medical equipment, aerospace systems and defence
> systems is widespread, and even everyday domestic appliances such as dishwash-
> ers, televisions, washing machines and video recorders now include at least one
> such device.
> II   What type of processor is discussed?
> This book focuses on the embedded systems based on the 8051 family of microcon-

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, finite state machines

---

> processor. However, such a move can require a major investment in staff, training
> and development tools. An alternative is to use one of the Extended 8051 devices
> introduced in recent years by a range of manufacturers (see Figure 1.4). 
> One important application area for Extended 8051s has been the automotive
> sector. Recent economic, legislative and technological developments in this sector
> mean that an increasing number of road vehicles contain embedded systems.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, device driver development

---

> are of little value in embedded systems, where sophisticated graphics screens,
> printers and disks are generally unavailable. 
> As a consequence, the simplest architecture in an embedded system is typically a
> form of ‘Super Loop’ (see Listing 1.1).
> Listing 1.1    Part of a simple Super Loop demonstration
> void main(void)
> {
> // Prepare run function X
> X_Init();
> while(1) // ‘for ever’ (Super Loop)
> {
> X(); // Run function X()
> }
> }
> 10Embedded C

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, super loop architecture

---

> Books, training courses, code samples and WWW sites discussing the use of the
> language are all widely available.
> Overall, C’s strengths for embedded system development greatly outweigh its
> weaknesses. It may not be an ideal language for developing embedded systems,
> but it is unlikely that a ‘perfect’ language will ever be created. 
> 1.5   Which operating system should you use?
> Having opted to create our 8051-based applications using C, we can now begin to

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, device driver development

---

> 4.1   Introduction
> In earlier chapters, we have considered some of the fundamental differences
> between software development for desktop systems and embedded systems. We’ve
> noted that embedded systems usually execute one program, which begins running
> when the device is powered up. We’ve begun to look at a simple software architec-
> ture – the Super Loop – that is used at the heart of many embedded systems.
> Another key challenge for desktop programmers moving into the embedded

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, device driver development

---

> 7.1   Introduction
> The Super Loop architecture illustrated in Listing 7.1 is used in many embedded
> applications and has formed the basis of all of the example code which we have
> considered  in  previous  chapters.  From  the  developer’s  perspective,  the  main
> advantages of this architecture are that it is easy to understand, and that it con-
> sumes virtually no system memory or CPU resources.
> Despite  these  advantages,  Super  Loops  are  not  an  appropriate  basis  for  all

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** super loop architecture, memory architecture

---

> consider how this language can be used. In doing so, we will begin to probe some of
> the differences between software development for desktop and embedded systems.
> In the desktop environment, the program the user requires (such as a word
> processor  program)  is  usually  loaded  from  disk  on  demand,  along  with  any
> required data (such as a word processor file). Figure 1.5 shows a typical operating
> environment for such a word processor. Here the system is well insulated from the

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, device driver development

---

> microwave ovens, video recorders, security systems, garage door controllers).
> Aerospace applications(including flight control systems, engine controllers,
> autopilots and passenger in-flight entertainment systems).
> Medical equipment(including anaesthesia monitoring systems, ECG moni-
> tors, drug delivery systems and MRI scanners). 
> Defence systems(including radar systems, fighter aircraft flight control sys-
> tems, radio systems and missile guidance systems).

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** monitoring and control systems

---

> Listing 7.7 shows the key source code from an operating system based on Timer 0,
> with manual reloads. The code may be easily adapted to work with Timer 1 if required.
> Listing 7.7    Driving sEOS using Timer 0. See text for details.
> /*------------------------------------------------------------*-
> Simple_EOS.C (v1.00)
> -------------------------------------------------------------
> Main file for Simple Embedded Operating System (sEOS) for 8051.
> *** This version uses T0 (easily adapted for T1) ***

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** simple embedded operating system (seos)

---

> 6.1   Introduction
> In this chapter, we begin to consider the issues involved in the accurate measure-
> ment of time. These issues are important because many embedded systems must
> satisfy real-time constraints.
> For example, consider the aircraft autopilot application illustrated in Figure 6.1.
> Here we assume that the pilot has entered the required course heading, and that
> the  system  must  make  regular  and  frequent  changes  to  the  rudder,  elevator,

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, real-time systems

---

> b)    Tasks, functions and scheduling
> Before we consider the implementation of this simple embedded operating system,
> we should first say something about the terminology used to describe such systems. 
> In discussions about embedded systems, you will frequently hear and read
> about ‘task design’, ‘task execution times’ and ‘multi-tasking’ systems. In this con-
> text, the term ‘task’ is usually used to refer to a function that is executed on a

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, scheduling theory

---

> generally aim for an average power consumption of less than 10 mA. As the table
> makes clear, this means that operating in ‘Normal’ mode for extended periods is
> not a practical option.
> The Infineon C501 is an example of a Standard 8051 device, which offers
> power-down  modes  identical  to  those  available  in  the  8052  and  many  other
> modern devices. The following description of the C501 idle modes, adapted from

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** idle and power-down operating modes

---

> The 8051 has a serial port compatible with what is commonly referred to as the
> RS-232 communication protocol. This allows you to transfer data between an 8051
> microcontroller and some form of personal computer (desktop PC, notebook PC
> or similar).
> Such an interface is common in embedded processors, and is widely used. Here
> are some examples:
> The serial port may be used to debug embedded applications, using a desktop PC.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** serial communication, rs-232 protocol

---

> xiiiPreface
> An animatronic dinosaur.
> A general-purpose data acquisition system.
> These and other examples are used to illustrate key software architectures that are
> in  widespread  use  in  embedded  designs;  the  examples  may  be  adapted  and
> extended to match the needs of your own applications.
> The book concludes with a final case study: this brings together all of the fea-
> tures discussed in earlier chapters in order to create an intruder alarm system. This

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** intruder alarm system case study

---

> a crucial requirement in the cost-conscious embedded market. You simply cannot
> acquire these skills by developing code for a Pentium (or similar) processor.
> III   Which operating system is used?
> The 256 bytes of memory in the 8051 are – of course – insufficient to support any ver-
> sion of Windows, Linux or similar desktop operating systems. Instead, we will describe
> how to create your own simple ‘embedded operating system’ (see Chapter 7). This ‘do-

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, embedded linux

---

> In Figure 2.5, the memory addresses are given in hexadecimal notation. This is a
> base-16 numbering scheme which provides a compact way of representing large
> binary numbers: it is widely used in embedded systems. Note that the prefix ‘0x’ is
> used in C (and elsewhere) to indicate that a number is in ‘hex’ notation.
> Table 2.1 shows a list of numbers with their hex, binary and ‘ordinary’ decimal
> representations.
> c)    The 8051 memory architecture

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, memory architecture

---

> Pin 10 and Pin 11 are used to receive and transmit (respectively) serial data using the ‘RS-232’
> protocol. See Chapter 9 for details.
> Pin 12 and Pin 13 are used to process interrupt inputs. We say more about interrupts in Section 2.9.
> Pin 14 and Pin 15 have alternative functions associated with Timer 0 and Timer 1 (see Section 2.8).
> Pin 16 and Pin 17 are used when working with external memory (see Section 2.6).

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** timer interrupts, rs-232 protocol

---

> Most important of all, we can use it to generate regular ‘ticks’, and drive an
> operating system: we say a little more about this in the next section.
> 2.9   Interrupts
> If you were to ask developers who are experienced in embedded systems to sum up
> in one word the difference between desktop software and embedded software,
> many would probably choose the word ‘interrupt’.
> From a low-level perspective, an interrupt is a hardware mechanism used to

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, timer interrupts

---

> As we noted above, three of the ‘8051 / 8052’ interrupt sources are associated
> with on-chip timers. This is because such timers are a particularly effective and
> widely-used source of interrupts. For example, we can use such timers to gener-
> ate an interrupt (a ‘tick’) at regular and precise intervals of (say) 1 millisecond.
> As we will see in Chapter 7, such ‘timer ticks’ form the basis of all real-time
> operating systems.
> 2.10   Serial interface

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems, timer interrupts

---

> that some people consider O-O languages to be 5GLs: however, this distinction will not have
> an impact on our discussions here
> Language generationExample languages
> –Machine Code
> First-Generation Language (1GL)Assembly Language.
> Second-Generation Languages (2GLs)COBOL, FORTRAN
> Third-Generation Languages (3GLs)C, Pascal, Ada 83
> Fourth-Generation Languages (4GLs)C++, Java, Ada 95
> 15.   Graham, I. (1994) Object-Oriented Methods, (2nd edn) Addison-Wesley, Harlow, England, p. 1.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** object-oriented style in c

---

> More flexible than PROMs and once very common, UV EPROMs now seem
> rather primitive compared with EEPROMs (see below). They can be useful for pro-
> totyping but are prohibitively expensive for use in production.
> Many older members of the 8051 family are available with on-board UV EPROM. 
> EEPROM and Flash ROM
> Electrically-Erasable Programmable Read-Only Memory (EEPROMs) and ‘Flash’
> ROMs are a more user-friendly form of ROM that can be both programmed and
> erased electrically.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** flash memory and flash rom

---

> Listing 4.4    Reading and writing bits (generic version). See text for details
> /*------------------------------------------------------------*-
> Bits2.C (v1.00)
> -------------------------------------------------------------
> Reading and writing individual port pins.
> NOTE: Both pins on the same port
> --- Generic version ---
> -*------------------------------------------------------------*/
> #include <reg52.H> 
> // Function prototypes
> void Write_Bit_P1(const unsigned char, const bit);

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** port pin reading

---

> The 8051 does not support signed arithmetic and extra code is required to
> manipulate signed data: this reduces your program speed and increases the pro-
> gram size. Wherever possible, it makes sense to use unsigned data, and these
> typedefstatements make this easier. 
> Use  of  bitwise  operators  (see  Chapter  4)  generally  makes  sense  only  with
> unsigned data types: use of ‘typedef’ variables reduces the likelihood that pro-
> grammers will inadvertently apply these operators to signed data.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** bit variables and bitwise operators

---

> Finally, as in desktop programming, use of the typedefkeyword in this way can
> make it easier to adapt your code for use on a different processor (for example,
> when you move your 8051 code to a 32-bit environment). In many circumstances,
> you will simply be able to change the typedefstatements in Main.H, rather than
> editing every source file in your project.
> d)    Interrupts
> As we noted in Chapter 2, interrupts are a key component of most embedded systems.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems, timer interrupts

---

> // Debounce – just wait...
> DELAY_LOOP_Wait(DEBOUNCE_PERIOD);
> // Check switch again
> if (Switch_pin == 0)
> {
> Return_value = SWITCH_PRESSED;
> }
> }
> // Now return switch value
> return Return_value;
> }
> /*------------------------------------------------------------*-
> DISPLAY_SWITCH_STATUS_Init()
> Initialization function for the DISPLAY_SWITCH_STATUS library.
> -*------------------------------------------------------------*/
> void DISPLAY_SWITCH_STATUS_Init(void)
> {
> Output_port = 0xF0;
> }
> 73Reading switches

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** port pin reading

---

> Listing 6.5    The file TimeoutL.H. See text for details
> /*------------------------------------------------------------*-
> TimeoutL.H (v1.00)
> -------------------------------------------------------------
> Simple software (loop) timeout delays for the 8051 family.
> * THESE VALUES ARE NOT PRECISE – YOU MUST ADAPT TO YOUR SYSTEM *
> -*------------------------------------------------------------*/
> #ifndef _TIMEOUTL_H
> #define _TIMEOUTL_H
> // ------ Public constants ------------------------------------

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** software loop delays

---

> Timer 2 has this facility when used in 16-bit mode whereas Timer 0 and Timer 1
> can only be reloaded automatically when operating in 8-bit mode. In typical 8051
> applications, an 8-bit timer can only be used to generate interrupts at intervals of
> around 0.25 ms (or less). This can be useful for some applications where very rapid
> processing is required. However, in most cases, this short tick interval will simply
> increase the processor load imposed by the operating system.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** timer interrupts, signal processing

---

> C_HEAT_Init();
> 11Programming embedded systems in C
> FIGURE 1.6An overview of a central heating controller
> Central
> heating
> controller
> Boiler
> Temperature
> sensor
> Temperature
> dial
> 8322 Chapter 1 p1-16  21/2/02  9:52 am  Page 11

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** embedded systems

---

> #define T_20ms_L (T_20ms % 256)
> //
> // Define initial Timer 0 / Timer 1 values for ~50 msec delay
> 139Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 139

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems

---

> TMOD |= 0x01; // Set required T0 bits (T1 left unchanged) 
> ET0 = 0;      // No interrupts
> // Simple timeout feature – approx 50 μs
> TH0 = T_50micros_H; // See TimeoutH.H for T_ details
> TL0 = T_50micros_L;
> TF0 = 0; // Clear flag
> TR0 = 1; // Start timer
> while (!TF0);
> TR0 = 0; 
> // Normally need to report timeout TIMEOUTs
> // (this test is for demo purposes here)
> if (TF0 == 1)
> {
> 141Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 141

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems, timer interrupts

---

> series of generations (see Table 5.1).
> It is often argued that object-oriented (O-O) design – and O-O programming lan-
> guages – have advantages when compared with those from earlier generations. For
> example, as Graham notes:
> 15
> [The phrase] ‘object-oriented’ has become almost synonymous with modernity, good-
> ness and worth in information technology circles.
> 82Embedded C
> TABLE 5.1The classification of programming languages into different generations. Please note

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** object-oriented style in c

---

> Switch_Wait.C (v1.00)
> -------------------------------------------------------------
> Simple library for debouncing a switch input.
> NOTE: Duration of function is highly variable!
> -*------------------------------------------------------------*/
> #include "Main.H"
> #include "Port.H"
> 106Embedded C
> 8322 Chapter 5 p81-112  21/2/02  9:57 am  Page 106

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** switch debouncing

---

> bit SWITCH_Get_Input(const tByte DEBOUNCE_PERIOD)
> {
> tByte Return_value = SWITCH_NOT_PRESSED;
> tLong Timeout_loop = LOOP_TIMEOUT_INIT_10000ms;
> if (Switch_pin == 0)
> {
> // Switch is pressed
> 135Meeting real-time constraints
> 8322 Chapter 6 p113-142  21/2/02  9:58 am  Page 135

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** real-time systems

---

> produced.  Such  devices  are  therefore  sometimes  referred  to  as  ‘factory-
> programmed ROM’. Mask programming is not cheap, and is not a low-volume
> option: mistakes can be very expensive, and providing code for your first mask
> can be a character-building process. Access times are often slower than RAM:
> roughly 1.5 times that of DRAM.
> Many  members  of  the  8051  family  are  available  with  on-chip,  mask-
> programmed, ROM. 
> Programmable Read-Only Memory (PROM)

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** mask rom and prom

---

> The key to this library is the function SWITCH_Get_Input(), which is shown in
> context in Listing 4.5.
> Listing 4.5    Reading switch inputs (basic code)
> /*------------------------------------------------------------*-
> Switch_read.C (v1.00)
> -------------------------------------------------------------
> A simple 'switch input' program for the 8051.
> – Reads (and debounces) switch input on Pin1^0
> – If switch is pressed, changes Port 3 output

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** port pin reading

---

> addresses of the special function registers (SFRs) used for port access, plus similar
> details for other on-chip components such as analog-to-digital converters.
> For example, Listing 5.4 shows part of the device header for an Extended 8051,
> the Infineon C515C. This device has eight ports, a watchdog unit, analog-to-digital
> converter and other components, all made accessible through the device header.
> Listing 5.4    Part of a device header file (Infineon C515C). Copyright Keil Elektronik GmbH

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design, real-time and safety-critical systems, computer architecture and microelectronics
**Concepts:** special function registers (sfrs)

---

### CMP Books - C Programming for Embedded Systems - fly

*File: CMP Books - C Programming for Embedded Systems - fly.pdf*

> Page vii
> Table of Contents
> Acknowledgmentsv
> Chapter 1 
> Introduction
> 1
> Role of This Book1
> Benefits of C in Embedded Systems2
> Outline of the Book3
> Typographical Conventions3
> Updates and Supplementary Information4
> Chapter 2 
> Problem Specification
> 5
> Product Requirements5
> Hardware Engineering6
> Software Planning8
> Software Architecture9
> Pseudocode10
> Flowchart11
> State Diagram12
> Resource Management13
> Testing Regime14

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** problem specification, product requirements specification, software planning, software architecture, interface specification for peripherals

---

> Product Functionality37
> Hardware Design38
> Software Design39
> Software Architecture39
> Flowchart40
> Resource Management42
> Scratch Pad42
> Interrupt Planning42
> Testing Choices44
> Design for Debugging44
> Code Inspection44
> Execution within a Simulator Environment45
> Execution within an Emulator Environment45
> Target System in a Test Harness45

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** software planning, software architecture, design for debugging

---

> Page 5
> Chapter 2— 
> Problem Specification
> The problem specification is the initial documentation of the problem that your device and software 
> will solve. It should not include any specific design questions or product solutions. The main aim is 
> to explain in detail what the program will do.
> Of course, there are as many ways to conduct project planning as there are workplaces on the planet. 
> Even the most standardized phases are observed in different fashions or in a different order. The

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** problem specification, software planning, interface specification for peripherals

---

> Both hardware and software can benefit from early consideration of debugging needs. Especially in 
> systems with alphanumeric displays, software can communicate faults or other out-of-spec 
> information. This infor-

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** hardware engineering considerations

---

> The central decision in hardware design is processor selection. The choice of a processor is a 
> negotiated decision, weighing factors such as the resources needed by the intended application, the 
> cost and availability of the part supply, and the development tools available. For an in-depth 
> treatment of microcontrollers, see the next chapter. Memory estimation does form part of our 
> problem specification, so estimation of RAM and ROM sizes is discussed in Section 2.3.5, Resource 
> Management.

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** problem specification, resource management and estimation

---

> General decisions about hardware form part of the problem specification, especially in embedded 
> projects in which the hardware will be well controlled.

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** problem specification

---

> Page 37
> Chapter 4— 
> Design Process
> The design process mirrors the problem specification, making concrete decisions about each general 
> point raised previously.
> 4.1— 
> Product Functionality
> We can mirror the product requirements, the user-oriented checklist of tasks that the product should 
> perform, with some details about the device to be designed.
> Results
> •  Program will measure current temperature. We will have to service and read an A/D converter

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** problem specification, product requirements specification

---

> microcontrollers because of memory concerns. Reentrant or recursive functions, gems of 
> programming in desktop systems, assume abundant stack space and are practically impossible.

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** control systems

---

> Results
> While we don't deal with hardware engineering in this book, we include some sample product 
> specification information for hardware to complete the information set.
> Table 2.1 Initial hardware specifications
> Engineering FactorsEstimate
> Operating Environment• domestic environment
>  
> • medium-power, medium-noise electrical connections
>  
> • occasional power loss
> (table continued on next page)

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** interface specification for peripherals

---

> Page 173
> N
> nonmaskable interrupts 26
> nonvectored arbitration 27
> P
> parameters 60
> pow() 135, 156
> processor state 29
> pseudocode 9
> Q
> qsort() 135
> QSORT_COMPARE 135
> R
> radix 132, 133
> RAM 58
> rand() 131
> randmize() 131
> real numbers 63
> S
> scopes 21
> short data type 61
> simulator 108
> sin() 153
> sinh() 154
> size_t 136
> sqrt() 156
> srand() 131
> stack 20
> state diagram 9

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** maskable and nonmaskable interrupts

---

> Page 46
> For the programmer, the challenge lies in understanding the difference between the test harness and 
> the real world. Hopefully, you will not have to change important constants like prescalar values.
> Results
> For initial code inspection, we will use the C6805 listing file. The listing file includes numerous 
> reports that are useful both during code-and-compile cycles, and when doing code review on others' 
> work.

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** code inspection and review

---

> timers, and TMR3 is a 16-bit timer.
> 3.4— 
> Interrupt Circuitry
> Microcontrollers usually provide hardware (signal) interrupt sources, and sometimes offer software 
> (instruction) sources. In packages with restricted pin counts, IRQ signals may not be exposed or may 
> be multiplexed with other I/O signals.
> Interrupts that can be disabled are maskable; those which you cannot disable are nonmaskable 
> interrupts. For example, RESET is nonmaskable; regardless of the code currently executing, the

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** maskable and nonmaskable interrupts

---

> Page 167
> declaration 
> A specification of the type, name, and possibly the value of a variable.
> dereference 
> Also * or indirection. Access the value pointed to by a pointer.
> E
> EEPROM 
> Electrically erasable programmable read only memory.
> embedded 
> Fixed within a surrounding system or unit. Also, engineered or intended to perform one specific 
> function in a specific environment.
> endianness 
> The distinction of multibyte data storage convention. Little-endian stores the least-significant byte

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** interface specification for peripherals

---

> ROMable 
> Code that will execute when placed in ROM.
> RS-232 
> A standard serial communication port.
> S
> SCI 
> Also UART (Universal Asynchronous Receiver Transmitter). SCI is an asynchronous serial interface. 
> The timing of this signal is compatible with the RS-232 serial standard, but the electrical 
> specification is board-level only.
> SPI 
> Serial Peripheral Interface bus. A board-level serial peripheral bus.
> scope 
> A variable's scope is the areas of a program in which it can be 
> accessed.
> shift

**Categories:** embedded systems engineering, software engineering, computer architecture, real-time systems, electrical and electronic engineering
**Concepts:** interface specification for peripherals

---

### Embedded C - Traps And Pitfalls

*File: Embedded C - Traps And Pitfalls.pdf*

> www.keil.co.uk
>  page 31 of 37  
> 7.  Conclusion  
> Embedded Engineering is just that.  An engineering discipline.  Like 
> architecture, embedded engineers should use the discipline of proper 
> construction methods and work within the rules.  With practice, this will 
> produce robust and safe systems automatically (and quickly). 
>  
> Once one has got over the learning curve of doing things rigorously, ones 
> mind is free design with flair.  Most of the worlds great buildings were

**Categories:** embedded systems engineering, software engineering, real-time systems, safety-critical systems engineering, programming languages and compilers
**Concepts:** embedded engineering discipline, engineering rigor, systems engineering

---

> analysers (that are also vastly more expensive and time consuming to set 
> up)  
>  
> Apart from using lint always run the compiler on it’s highest level of error 
> checking. 
>  
> MISRA-C is a very good set of rules for using C in safety critical embedded 
> situations.  PC-Lint has a configuration file to test for as many of the MISRA-
> C rules as it possible statically.  MISRA-C also shows how to construct a 
> conformance chart. I would recommend this to any developer who needs

**Categories:** embedded systems engineering, software engineering, real-time systems, safety-critical systems engineering, programming languages and compilers
**Concepts:** static analyser configuration for safety rules, configuration management

---

> www.keil.co.uk
>  page 3 of 37  
> Contents 
> 1. Introduction.................................................................................................... 4 
> 2. C History.......................................................................................................... 6 
> 3. SW Engineering with C................................................................................ 7 
> 3.1.

**Categories:** embedded systems engineering, software engineering, real-time systems, safety-critical systems engineering, programming languages and compilers
**Concepts:** engineering rigor

---

> 3.2.8.
>  
> Static linkage.............................................................................................................. 19
>  
> 3.2.9.
>  
> Declaration and initialisation.................................................................................. 19
>  
> 3.3.
>  
> How to prove it is Good C............................................................................20
>  
> 3.3.1.
>  
> Formal Eastern European Writing......................................................................... 21

**Categories:** embedded systems engineering, software engineering, real-time systems, safety-critical systems engineering, programming languages and compilers
**Concepts:** initialization at declaration

---

> the trivial time wasting parts of a project and lets you get on with innovative 
> and safe designs.  
> I recommend that you read MISRA-C and Konigs Traps and Pitfalls. 
>  
>  
> I shall finish with the last line of the introduction:  
>  
> It is well worth buying good quality tools. 
>  
> and add:- 
>  
> The ART in Embedded Engineering comes though 
> good engineering discipline.

**Categories:** embedded systems engineering, software engineering, real-time systems, safety-critical systems engineering, programming languages and compilers
**Concepts:** embedded engineering discipline, engineering rigor

---

> www.keil.co.uk
>  page 24 of 37  
> 4.  Embedded  Engineering  
>  
> Embedded Engineering whilst having many similarities with “ordinary” 
> SW Engineering is different.  Different that is to “ordinary” SW 
> Engineering and every other embedded project.  Whilst embedded 
> systems share many similar attributes no two are the same. 
>  
> In general, embedded systems tend to be single task.  Albeit that the 
> larger systems may have an operating system and many processes

**Categories:** embedded systems engineering, software engineering, real-time systems, safety-critical systems engineering, programming languages and compilers
**Concepts:** engineering rigor, systems engineering

---

### C Programming for Scientists and Engineers

*File: C Programming for Scientists and Engineers.pdf*

> Variables, data types  and declaration statements     11
> be stored. In addition to storing integer values in int type variables,
> char variables can also be used. However, since char variables occupy
> just  one  byte,  the  following  restrictions  apply,  depending   on
> whether the variable is signed or unsigned:
> char                   integer character code,  range 0 to 127
> signed char       signed  integer values  within the range -128  to 127

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements, signed and unsigned integer types

---

> unsigned char   integer values within the range 0 to 255
> Typical forms of declaration  statements for integers  are:
> int A;                              declares  an int variable  called A
> int counter, limit = 100;   declares  two int variables, initializing the second
> short int B = -32000;      declares  and initializes a short int variable
> Since  there   are   several  types  of  integer   variables,   different
> formatting  codes are required  by fscanf  to read data  into them  from

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements, signed and unsigned integer types

---

> Variables,  data types  and declaration statements      13
> fprintf(stdout,  "The integer  value is %lu\n", F);
> return(0);
> Tutorial 1.3
> Implement  Program   1.2.  Write brief  notes  on  the  action  of
> each statement in the program.
> Tutorial  1.4
> Modify  Program  1.2  so that  the  values that  are  read  in  are
> displayed  in reverse  order.  Ensure that  the  program  contains
> appropriate comments  and that appropriate messages  appear
> on the screen with each displayed  value.

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements, return statements and return types

---

> Variables,  data types and declaration statements      29
> /* Program  1.8 - Reading and writing a data structure  using pointers  V
> /include <stdio.h>
> int  main(void)
> {
> struct  employee
> {
> int number;
> char femily_name[101];
> float  salary;
> };
> struct employee employee_ 1, 'employee^ 1_ptr;
> employee_ 1_ptr = &employee_ 1;
> fprintf(stdout,  " Enter employee  number:");
> fscanf(stdin,  "%d",  &employee_1_ptr->number);
> fprintffstdout,  " Enter employee family  name:");

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements, pointers and pointer types

---

> Manufacturing Enginoxring 
> Modular SeriEs 
> C Programming 
> for 
> Scimtists 
> G Engincws 
> Robert 1 Wood

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** modular programming

---

> Contents
> Introduction                                                                                        1
> 1.       Variables, Data Types and Declaration Statements              6
> 1.1     Introduction                                                                 6
> 1.2     The  character  data type                                              7
> 1.3     The  integer data type                                                 10

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> different  tools for  their  solution.  Procedural  languages,  such as C,
> are typically more appropriate  than object-oriented languages,  such

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** object-oriented programming

---

> 14     C programming  for scientists and engineers
> The float  and  double  data  types are  available in  all C  programming
> environments,  but  long  double  is limited  to  the  use  of very  high
> precision  floating  point  hardware. Also, variables of type float and
> double are often referred to as single precision and double precision
> variables, respectively. Typical forms  of declaration statement are:

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** single and double precision floating point

---

> 28 
> C programming for scientists and engineers 
> 1.9 Pointers to data structures 
> In addition to using the dot operator to access members of a data 
> structure by hlly qualift-ing them, 
> indirect access is  also possible 
> through the use 
> of a pointer and the ‘indirection’ operator, ‘->’. To 
> do this it is necessary to declare a pointer of the correct data type, as 
> shown below. 
> struct employee 
> int number; 
> char family-name[lOl]; 
> float salary; 
> 1; 
> {

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** dot operator for struct member access

---

> have  already  been  introduced  in  Chapter  1.  However, several
> examples are given below to reinforce their actions.
> Firstly,  the [...]  identifier could be called the  'element operator'
> which is used to identify  a particular element of an array, as in:
> int A,  B[3];
> A = B[2J;    assigns the value of the third element of array B to A
> Secondly,  the  'dot  operator',  .  ,  is used  with  the  name  of  a  data
> structure to access its member variables, as in:

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** dot operator for struct member access

---

> strings  and  data  structures, Sections  1.6,  1.7 and  1.8, respectively,
> can be passed back via the return statement in certain versions of C.
> After  describing  the essential statements needed  in any  function,
> the  remainder  of  this  chapter  is  concerned  with  the  interface
> between calling and  called functions and ways in which variables of
> different  data types can be passed between them.
> 3.2 Essential statements  in any  function

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** return statements and return types

---

> Introduction
> The  aim  of  this  book  is to  provide  a rapid  introduction  to  the  C
> programming language. C is a procedural language and should not
> be confused with C+ + , which requires a significantly  different way
> of thinking about problems and  their  solutions. With the  explosion
> of  texts  on  C++   and  other  object-oriented  languages  in  recent
> years,   along  with  the   perception   that   C + +   is  somehow  a

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** procedural programming, object-oriented programming

---

> Identifying   operators,   but   more   detailed   consideration   of
> Relational and  Logical operators must wait until their  more typical
> use in decision making, in Chapter  4 onwards.
> C  provides a  broad  range  of  arithmetic  operators  that  can  be
> combined in many ways within executable  statements. Care  should
> be taken, however, over the data types of their operands and  of the
> results that  they produce,  to ensure  that problems don't  arise with

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** precision loss and truncation considerations

---

> decisions and loops will be considered in later chapters.
> All  executable  statements  involve  the  use  of  operators  and
> operands.  Operands  are items of data  -  variables, constants and
> values returned from  functions. The  latter will be discussed in more
> detail  in  Chapter  3.  Until  then,  however, simply consider  that
> operands  can  be  variables  and  constants  of  types int,  char,  float,
> double, pointer, elements of arrays and  members of data structures.

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** return statements and return types

---

> these by combining various operators,  such as 'add',  'divide'  etc.,  and
> variables, such as X  or  Y. There are  two general  types of statements
> in C -  declaration statements that are used to create variables, and
> executable  statements used  to  combine operators  and  variables in
> ways  that  make the  computer  do  something useful.  In  all but  the

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> a  common  understanding  of  these  data  types.  main  declares  two
> pointers,  io_ptr  and  example_ptr,  using  these  data  types.  It  is
> intended  that  the  read_filenames   function  will  allocate  memory
> needed to store the filenames and  that the  read_points  function  will
> allocate memory needed  to store  the  points that define a  triangle.
> Both  functions  will return  the  addresses  of this  allocated  memory

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** pointers and pointer types

---

> only.  In  addition,  there  are  two modifiers,  h  meaning  short  and  l
> meaning long. Table  1.2 summarizes these options.
> Table  1.2   Formatting  codes  required for  different    integer  data types
> Data type
> short  int
> unsigned  short  int
> int
> unsigned  int
> long int
> unsigned long int
> Basic formatting
> code
> %d
> %u
> %d
> %u
> %d
> %u
> Modifier
> h
> h
> l
> l
> Required formatting
> code
> %hd
> %hu
> %d
> %u
> %ld
> %lu
> Program  1.2 shows how different  formatting  codes  are  used when

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** signed and unsigned integer types

---

> Looking  at  the  get_nodes  function,  fe_mesh_ptr   is  declared  in  the
> argument list to hold the  copy of mesh_ptr  that is passed from main.
> The  first  two  declaration  statements  specify  return_code,  i  and
> no_items_counted  as integers. return_code  is used  to provide  feedback
> to main, via the  return statement, indicating success or failure of the
> reading  process.  Variables  no_items_counted  and  i  are used, respec-

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> does not cover every feature that C provides. The  decision over what
> to include  and  exclude in an introductory  text such as this can only
> be  subjective.  I  apologize  to  anyone  who  feels  that  I  have  done
> programming,  and  C in particular, a disservice by excluding  some-
> thing  that  they  feel  strongly  about.  My main  consideration  in
> creating  and  using  these  notes  has  always  been  to  provide  a  firm
> foundation on which more  specialized knowledge and expertise can

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** precision loss and truncation considerations

---

> int. Another  feature of the  integer  data  type is that  variables may
> hold  either  positive  (unsigned)  values only  or  either  positive or
> negative values (signed). To restrict  an  integer  variable to  storing
> only positive values, int is preceded by unsigned. The  ANSI
> 2
>  standard
> data  types for these different  options are  shown in Table  1.1, along
> with the amount of memory used and  the minimum range  of values
> that can be  stored:
> Table  1.1  Integer data  types
> Datatype

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** signed and unsigned integer types

---

> be built.
> The  book is divided into the following chapters:
> variables, data types and declaration  statements;
> executable  statements;
> functions;
> decisions and loops;
> files and formatting;
> dynamic memory management  and  linked lists.
> Each chapter is further  divided  into  sections  that involve the reader
> in  various  programming  activities guided  by  tutorial  questions.
> There are further tutorial  problems at the end of the book that aim

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> 12     C programming tor scientists and engineers
> /*  Program 1.2 - Reading and  writing different  types of integer data */
> #include <stdio.h>
> int main(void)
> {
> short int A;
> unsigned short  int B;
> int C;
> unsigned int D;
> long int E;
> unsigned long int F;
> /* reading and writing a short int */
> fprintf(stdout,  "Enter an integer value between -32768 and 32767:");
> fscanf(stdin,  "%hd", &A);
> fprintf(stdout,  "The integer value is %hd\n",  A);
> /* reading and writing an unsigned short int */

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** signed and unsigned integer types

---

> Next,  the  modulus  operator,  %,  finds  the  remainder  of  the
> division of two integer values, thus:
> intA = 6, B = 4,C;
> C = A%B;             the value 2 is assigned to variable C
> C = B%A;             the value 4 is assigned to variable C
> It  should  be  noted  that  the  application of an  operator  to  one  or
> more  operands,  such  as A  +  B,  gives  a  result without  that result
> being assigned to some other variable. Exactly what happens to this

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** modulus operator and integer remainder

---

> 124     C programming  for scientists and engineers
> The  following changes  have  been  made  to  develop  Program  6.2
> from  Program  5.2.
> Before main
> Dynamic  memory  allocation  functions are  made  available to  the
> program by using the  #include  <stdlib.h>  statement.
> In main
> Variables of the struct files and struct triangle data types are no  longer
> declared, but the declarations for pointers to variables of these types
> are  retained.

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** pointers and pointer types

---

> Variables, data types  and declaration statements     15
> /* reading and writing a double  */
> fprintf(stdout,  "Enter a value between 2.225e-308 and 1,797e+308 as a  decimal:");
> fscanf(stdin,  "%lf", &B);
> fprintf(stdout,  "The value as a decimal is %lf\n",  B);
> fprintf(stdout,  "The value as an exponential is %e\n", B);
> /* reading and writing a double  7
> fprintf(stdout,  "Enter a value between 2.225e-308 and  1.797e+308 as an"
> "exponential:");
> fscanf(stdin,  "%le", &B);

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> types   and   pointers   that  were  discussed   in   Chapter   1.  Also,
> returned_data_type  can be  'void', meaning that no data is returned  from
> the called function. In the first line returned_data_type  is followed by the
> name  of the  function,  which  must be  unique within the  program. A
> function  may  or  may  not  have  an  argument  list,  depending  on
> whether  the  called  function  needs  to  receive data  from  the  calling

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** pointers and pointer types

---

> Variables,  data types  and declaration statements     19
> keyboard, it needs  to be  given the  address  of the variables that will
> be used to store each item of data. In this example, the addresses of
> A  and  B  are  already  stored  in  A_ptr  and  B_ptr,  respectively. This
> means  that  the  addresses  needed  by fscanf   can  be  specified  using
> A_ptr  and  B_ptr,  rather  than  &A  and  &B.  Following each  call  to

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> Variables,  data types  and declaration statements      9
> control  string  in  this  example  is a  formatting  code  that  instructs
> fscanf  to interpret  the data that it reads from  the  keyboard as a char-
> acter. The  third argument, &A, instructs fscanfto   store the  character
> that  it  has read  in  a variable calledA.  It  is very  important  to  note
> that  the  &  symbol  has  been  used  in  front  of  the  name  of  the

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> exactly  where  they  are  stored  in  memory. Various  sections in  this
> chapter have demonstrated  the rules that need to be followed when
> creating  variables  in  declaration  statements.  Other  sections have
> concentrated  on forming and using collections of data through  the
> creation and use of arrays and  data structures. Arrays are useful  but
> have  limitations. To partially overcome  these  limitations, C  allows
> data  structures  to  be  created  as  programmer-defined  data  types.

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> Variables, data types and declaration statements 25 
> their employee number, family name and salary. The most appro- 
> priate  data types  for storing these items are 
> int for employee 
> number, 
> char for family name andfloat for salary. If this information 
> is to be  processed  for many employees, we could  declare three 
> arrays, one for employee numbers, another for family names and a 
> third for salaries. 
> By doing this, however, the original collection of

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> screen.  Use pointer  variables  of the  correct  type  to  specify
> where fscanf   should store  the  data  and  use  the  'contents  of'
> operator with fprintf to display the data.
> 1.6 Arrays
> The  preceding  paragraphs  have  introduced  the  basic data  types,
> typical  declaration  statements  for  variables  of  these  types and  a
> general approach to getting individual items of information into and
> out of programs. However, it is more often  the  case that a program is

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> Variables,  data types  and declaration statements      27
> to  display the  data  values, again  accessing each  member  of  the
> data  structure  by fully  qualifying  it.
> If the  above data has to be  stored  for a number  of employees, we
> could use an array of data structures.  For example, the  statement:
> struct employee employees[10];
> creates  an  array  containing   10  elements,  each  of  which  is  a
> variable  of  type  struct  employee.  In  other  words,  this  statement

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

> built up  from  various combinations of the basic data types, arrays
> and  other  data  structures.  Data  structures  have  another  special
> significance  in  C because  C  treats  them  as  programmer-defined
> data types.
> Sections  in  this  chapter  consider  variables  of  each  data  type,
> above,  showing how they are  created  using declaration  statements
> and  how they are used to  store data that is read  from  the keyboard
> and then displayed on the screen.
> 1.2 The character data type

**Categories:** programming languages, scientific computing, software engineering, systems programming, computer science education
**Concepts:** variables and declaration statements

---

### C Programming for Embedded Systems

*File: C Programming for Embedded Systems.pdf*

> Page vii
> Table of Contents
> Acknowledgmentsv
> Chapter 1 
> Introduction
> 1
> Role of This Book1
> Benefits of C in Embedded Systems2
> Outline of the Book3
> Typographical Conventions3
> Updates and Supplementary Information4
> Chapter 2 
> Problem Specification
> 5
> Product Requirements5
> Hardware Engineering6
> Software Planning8
> Software Architecture9
> Pseudocode10
> Flowchart11
> State Diagram12
> Resource Management13
> Testing Regime14

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** embedded systems engineering, problem specification

---

> ROM Code Protection    Embedded processors often provide protection against casual examination 
> of your ROM code. A configuration bit inhibits reading of ROM through the programming 
> interface. While there are sev-

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** code protection and read protection

---

> Page 119
> Appendix A— 
> Table of Contents
> Introduction123
> Using the Libraries125
> Device Header Files and Definition Files126
> Math Library126
> Library Definitions127
> DEF.H
> 127
> STDIO
> 129
> STDIO.H and STDIO.C129
> gets and puts129
> STDLIB
> 130
> STDLIB
> 130
> rand and randmize130
> abs and labs131

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** device header files and definition files

---

> prevent any meaningful response from the embedded system at all, whereas desktop operating 
> systems can provide core dumps or other diagnostic aids.
> To make in-system debugging possible, simulators and emulators peer into the embedded system. 
> Each tries to approximate different areas of the target environment while allowing you to inspect 
> your software's performance thoroughly and easily. Software-only simulators are best used to

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** simulators and emulators, in-system debugging

---

> General decisions about hardware form part of the problem specification, especially in embedded 
> projects in which the hardware will be well controlled.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** problem specification

---

> Page 27
> a multi-byte fetch, and be interrupted part-way through, the loaded value becomes meaningless 
> without any notice.
> The code obeys our suggestion (Section 4.4.2, Interrupt Planning) about reading and writing 
> variables one way, between interrupt and main-line code. To provide complete protection, the 
> compiler needs to use indivisible instructions, or to disable interrupts temporarily, to protect the 
> main-line code.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** code protection and read protection

---

> compiler allocates memory for variables in function calls.
> There are three strategies for local memory allocation:
> Within a Stack Frame    This requires explicit stack-relative addressing, which is very much a 
> luxury. It isn't always a preferred code option, and the compiler may not use it even if available.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** local memory allocation strategies

---

> /* your main function and other code */
> This is referred to in the compiler manual as Absolute Code Mode. The compiler will search for a 
> matching library file for every header file included at the top of your source.
> Device Header Files and Definition Files
> The Code Development System relies upon header files for definitions and constants. These often 
> vary between part numbers. They are usually named for the part to which they apply, with a .h 
> extension.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** device header files and definition files

---

> Testing embedded software differs significantly from testing desktop software. One new central 
> concern arises: embedded software often plays a much more visceral role. Where a protection fault 
> on a desktop machine may cost the user hours of work, a software fault in an embedded system may 
> threaten:
> •  the user's safety or physical comfort,
> •  a lifeline of communication, or
> •  the physical integrity of the hosting equipment.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** code protection and read protection

---

> Page 32
> •  a watchdog time-out;
> •  low voltage, if your part supports power supply monitoring; or
> •  an instruction fetch from an illegal or unimplemented address, if your part implements protection 
> against this.
> The RESET interrupt prompts the chip to behave as if the power has been cycled. Since it does not 
> actually cycle the power to the chip, the contents of volatile memory, I/O ports, or processor 
> registers remain intact.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** code protection and read protection

---

> If the scratch pad allocation strains your memory budgeting, you can consider reusing the memory 
> yourself. The only condition is that you must manage variable scope yourself.
> For example, the Byte Craft compiler creates the 16-bit pseudo-index register __longIX. You can 
> reuse this 16-bit location with the following statement.
> long int myTemp @ __longIX;
> Should you store a value in myTemp, and then make a library call, the library software must not

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** register allocation and register reuse

---

> Page 173
> N
> nonmaskable interrupts 26
> nonvectored arbitration 27
> P
> parameters 60
> pow() 135, 156
> processor state 29
> pseudocode 9
> Q
> qsort() 135
> QSORT_COMPARE 135
> R
> radix 132, 133
> RAM 58
> rand() 131
> randmize() 131
> real numbers 63
> S
> scopes 21
> short data type 61
> simulator 108
> sin() 153
> sinh() 154
> size_t 136
> sqrt() 156
> srand() 131
> stack 20
> state diagram 9

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** maskable and nonmaskable interrupts

---

> Page 25
> Listing 3.3    Timer registers and interrupt handler
> #pragma portr TIMER_LSB @ 0x24; 
> #pragma portr TIMER_MSB @ 0x25; 
>  
> #pragma vector TIMER_IRQ @ 0xFFE0; 
>  
> void TIMER_IRQ(void) { 
>        /* IRQ handler code */ 
> }
> 3.3.1— 
> Watchdog Timer
> A COP (computer operating properly) or watchdog timer checks for runaway code execution. In 
> general, watchdog timers must be turned on once within the first few cycles after reset. Software

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** watchdog timer and COP

---

> Page 64
> It is also important to differentiate between near and far pointers. The differences in code 
> generation can be significant. For more information, see Section 6.9.4, Pointer Size Modifiers: 
> near
>  and 
> far
> .
> 6.7.2— 
> Arrays
> When you declare an array, you must declare both an array type and the number of elements it 
> contains. For example, the following declares an array containing eight int elements.
> int myIntArray[8];

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** near and far pointers

---

> timers, and TMR3 is a 16-bit timer.
> 3.4— 
> Interrupt Circuitry
> Microcontrollers usually provide hardware (signal) interrupt sources, and sometimes offer software 
> (instruction) sources. In packages with restricted pin counts, IRQ signals may not be exposed or may 
> be multiplexed with other I/O signals.
> Interrupts that can be disabled are maskable; those which you cannot disable are nonmaskable 
> interrupts. For example, RESET is nonmaskable; regardless of the code currently executing, the

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** maskable and nonmaskable interrupts

---

> Some peripherals can be replicated using generic I/O port lines and driver software. This saves 
> money but adds complexity to the programming challenge. Typically described as "bit-banging", 
> software must quickly and repeatedly write sequences of bits to port output lines, to imitate the logic 
> signals of a dedicated peripheral circuit.
> Standard libraries, which might not contemplate a particularly-optimized hardware solution, can pay 
> for the added hardware cost in reduced software cost.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** bit-banging and software peripherals

---

> Page 42
> 4.4— 
> Resource Management
> Now that we have some concrete information about the target platform, the development software, 
> and the way data will flow between parts of the software, we can begin to nail down resource usage.
> 4.4.1— 
> Scratch Pad
> Many C compilers use some available RAM for internal purposes such as pseudo-registers. An 
> efficient C compiler will support scratch pads in data memory. A scratch pad is a block of memory

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** scratch pad and pseudo-registers

---

> that can be used for more than one purpose. A pseudo-register is a variable used as the destination 
> for basic operations performed with larger data types. Your compiler documentation will detail the 
> size and purpose of scratch pad allocations.
> For example, if you attempt a 16-bit math operation on a chip with no natural 16-bit register, the 
> compiler will dedicate a portion of RAM for 16-bit pseudo-registers that store values during math 
> operations.

**Categories:** embedded systems engineering, real-time systems, software engineering, computer architecture, electronic hardware design
**Concepts:** scratch pad and pseudo-registers

---

