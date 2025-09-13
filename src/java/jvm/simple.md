## 脚本

```bash
#!/bin/bash

#========================================================================
# Java Application Management Script
# Description: Start, stop, restart and monitor Java applications
# Author: System Administrator
# Version: 1.0
# Date: $(date +%Y-%m-%d)
#========================================================================

# 脚本配置
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# 应用配置
APP_NAME="JavaApp"
APP_JAR="app.jar"
BASE_PATH="${BASE_PATH:-$SCRIPT_DIR}"
APP_PROFILE="${APP_PROFILE:-prod}"
JAVA_PATH="${JAVA_PATH:-java}"

# JVM配置参数
JVM_OPTS="-XX:+UseG1GC \
-Xms2g -Xmx2g -Xss128k \
-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=256m \
-XX:SoftRefLRUPolicyMSPerMB=1000 \
-XX:ParallelGCThreads=16 -XX:ConcGCThreads=8 \
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=/tmp/"

# 应用参数
APP_OPTS="-Dapp.path=$BASE_PATH \
-Dspring.profiles.active=$APP_PROFILE"

# 文件路径
PID_FILE="$BASE_PATH/app.pid"
LOG_FILE="$BASE_PATH/logs/app.log"
GC_LOG_FILE="$BASE_PATH/logs/gc.log"
ERROR_LOG_FILE="$BASE_PATH/logs/error.log"

# Screen会话名称
SCREEN_SESSION="${APP_NAME}_session"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#========================================================================
# 工具函数
#========================================================================

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# 打印信息消息
info() {
    print_message $BLUE "INFO: $1"
}

# 打印成功消息
success() {
    print_message $GREEN "SUCCESS: $1"
}

# 打印警告消息
warning() {
    print_message $YELLOW "WARNING: $1"
}

# 打印错误消息
error() {
    print_message $RED "ERROR: $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 command not found"
        return 1
    fi
    return 0
}

# 创建必要的目录
create_directories() {
    local dirs=("$BASE_PATH/logs" "/tmp")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            info "Created directory: $dir"
        fi
    done
}

# 检查Java环境
check_java() {
    if ! check_command "$JAVA_PATH"; then
        error "Java not found at: $JAVA_PATH"
        return 1
    fi
    
    local java_version=$($JAVA_PATH -version 2>&1 | head -n 1)
    info "Using Java: $java_version"
    return 0
}

# 检查应用JAR文件
check_jar() {
    if [ ! -f "$BASE_PATH/$APP_JAR" ]; then
        error "Application JAR not found: $BASE_PATH/$APP_JAR"
        return 1
    fi
    info "Application JAR found: $BASE_PATH/$APP_JAR"
    return 0
}

# 获取应用进程ID
get_pid() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "$pid"
        else
            rm -f "$PID_FILE"
        fi
    fi
}

# 检查应用状态
is_running() {
    local pid=$(get_pid)
    [ -n "$pid" ]
}

# 等待进程停止
wait_for_stop() {
    local timeout=${1:-30}
    local count=0
    
    while [ $count -lt $timeout ]; do
        if ! is_running; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

# 等待进程启动
wait_for_start() {
    local timeout=${1:-60}
    local count=0
    
    while [ $count -lt $timeout ]; do
        if is_running; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

#========================================================================
# 主要功能函数
#========================================================================

# 启动应用
start_app() {
    info "Starting $APP_NAME..."
    
    # 检查是否已经运行
    if is_running; then
        warning "$APP_NAME is already running (PID: $(get_pid))"
        return 1
    fi
    
    # 环境检查
    if ! check_java || ! check_jar; then
        return 1
    fi
    
    # 创建必要目录
    create_directories
    
    # 构建启动命令
    local run_cmd="$JAVA_PATH $JVM_OPTS $APP_OPTS -jar $BASE_PATH/$APP_JAR"
    
    # 记录启动信息
    info "Starting with command: $run_cmd"
    info "Base path: $BASE_PATH"
    info "Profile: $APP_PROFILE"
    info "Log file: $LOG_FILE"
    
    # 使用screen启动应用
    if check_command "screen"; then
        screen -dmS "$SCREEN_SESSION" bash -c "
            cd '$BASE_PATH'
            exec $run_cmd > '$LOG_FILE' 2> '$ERROR_LOG_FILE'
        "
        
        # 获取screen中的进程PID
        sleep 2
        local screen_pid=$(screen -list | grep "$SCREEN_SESSION" | cut -d. -f1 | tr -d ' \t')
        if [ -n "$screen_pid" ]; then
            # 查找Java进程
            local java_pid=$(pgrep -f "$APP_JAR")
            if [ -n "$java_pid" ]; then
                echo "$java_pid" > "$PID_FILE"
                info "Screen session created: $SCREEN_SESSION"
                info "Java process PID: $java_pid"
            fi
        fi
    else
        # 如果没有screen，直接启动
        warning "Screen not available, starting in background"
        cd "$BASE_PATH"
        nohup $run_cmd > "$LOG_FILE" 2> "$ERROR_LOG_FILE" &
        echo $! > "$PID_FILE"
    fi
    
    # 等待启动
    if wait_for_start 60; then
        success "$APP_NAME started successfully (PID: $(get_pid))"
        return 0
    else
        error "$APP_NAME failed to start"
        # 显示错误日志
        if [ -f "$ERROR_LOG_FILE" ]; then
            error "Error log:"
            tail -n 20 "$ERROR_LOG_FILE"
        fi
        return 1
    fi
}

# 停止应用
stop_app() {
    info "Stopping $APP_NAME..."
    
    if ! is_running; then
        warning "$APP_NAME is not running"
        return 1
    fi
    
    local pid=$(get_pid)
    info "Stopping process (PID: $pid)"
    
    # 优雅停止
    kill -TERM "$pid" 2>/dev/null
    
    if wait_for_stop 30; then
        success "$APP_NAME stopped gracefully"
        rm -f "$PID_FILE"
    else
        warning "Graceful stop failed, force killing..."
        kill -KILL "$pid" 2>/dev/null
        
        if wait_for_stop 10; then
            success "$APP_NAME force stopped"
            rm -f "$PID_FILE"
        else
            error "Failed to stop $APP_NAME"
            return 1
        fi
    fi
    
    # 清理screen会话
    if check_command "screen" && screen -list | grep -q "$SCREEN_SESSION"; then
        screen -S "$SCREEN_SESSION" -X quit
        info "Screen session terminated: $SCREEN_SESSION"
    fi
    
    return 0
}

# 重启应用
restart_app() {
    info "Restarting $APP_NAME..."
    stop_app
    sleep 3
    start_app
}

# 检查应用状态
status_app() {
    info "Checking $APP_NAME status..."
    
    if is_running; then
        local pid=$(get_pid)
        success "$APP_NAME is running (PID: $pid)"
        
        # 显示进程信息
        if command -v ps &> /dev/null; then
            echo "Process details:"
            ps -p "$pid" -o pid,ppid,cmd,etime,%cpu,%mem
        fi
        
        # 显示端口信息
        if command -v netstat &> /dev/null; then
            echo "Listening ports:"
            netstat -tlnp 2>/dev/null | grep "$pid" || echo "No listening ports found"
        fi
        
        return 0
    else
        error "$APP_NAME is not running"
        return 1
    fi
}

# 查看日志
log_app() {
    local log_type=${1:-app}
    local lines=${2:-50}
    
    case $log_type in
        "app"|"application")
            if [ -f "$LOG_FILE" ]; then
                info "Showing last $lines lines of application log:"
                tail -n "$lines" "$LOG_FILE"
            else
                warning "Application log file not found: $LOG_FILE"
            fi
            ;;
        "error")
            if [ -f "$ERROR_LOG_FILE" ]; then
                info "Showing last $lines lines of error log:"
                tail -n "$lines" "$ERROR_LOG_FILE"
            else
                warning "Error log file not found: $ERROR_LOG_FILE"
            fi
            ;;
        "gc")
            if [ -f "$GC_LOG_FILE" ]; then
                info "Showing last $lines lines of GC log:"
                tail -n "$lines" "$GC_LOG_FILE"
            else
                warning "GC log file not found: $GC_LOG_FILE"
            fi
            ;;
        *)
            error "Unknown log type: $log_type"
            echo "Available log types: app, error, gc"
            return 1
            ;;
    esac
}

# 进入screen会话
attach_screen() {
    if ! check_command "screen"; then
        error "Screen command not found"
        return 1
    fi
    
    if screen -list | grep -q "$SCREEN_SESSION"; then
        info "Attaching to screen session: $SCREEN_SESSION"
        info "Use Ctrl+A, D to detach from session"
        screen -r "$SCREEN_SESSION"
    else
        warning "Screen session not found: $SCREEN_SESSION"
        return 1
    fi
}

# 显示JVM信息
jvm_info() {
    if ! is_running; then
        error "$APP_NAME is not running"
        return 1
    fi
    
    local pid=$(get_pid)
    info "JVM information for process $pid:"
    
    # 检查jps命令
    if command -v jps &> /dev/null; then
        echo "Java processes:"
        jps -l | grep "$APP_JAR"
    fi
    
    # 检查jstat命令
    if command -v jstat &> /dev/null; then
        echo -e "\nGC statistics:"
        jstat -gc "$pid"
        echo -e "\nHeap statistics:"
        jstat -gccapacity "$pid"
    fi
    
    # 系统资源使用
    if command -v top &> /dev/null; then
        echo -e "\nCPU and Memory usage:"
        top -p "$pid" -b -n 1 | grep -A 1 "PID"
    fi
}

# 生成heap dump
heap_dump() {
    if ! is_running; then
        error "$APP_NAME is not running"
        return 1
    fi
    
    local pid=$(get_pid)
    local dump_file="/tmp/heapdump_${pid}_$(date +%Y%m%d_%H%M%S).hprof"
    
    if command -v jmap &> /dev/null; then
        info "Generating heap dump for process $pid..."
        jmap -dump:live,format=b,file="$dump_file" "$pid"
        
        if [ $? -eq 0 ]; then
            success "Heap dump generated: $dump_file"
        else
            error "Failed to generate heap dump"
        fi
    else
        error "jmap command not found"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
Usage: $SCRIPT_NAME {start|stop|restart|status|log|attach|jvm|heapdump|help}

Commands:
    start       - Start the $APP_NAME
    stop        - Stop the $APP_NAME
    restart     - Restart the $APP_NAME
    status      - Show application status
    log [type] [lines] - Show application logs
                 Types: app(default), error, gc
                 Lines: number of lines to show (default: 50)
    attach      - Attach to screen session
    jvm         - Show JVM information
    heapdump    - Generate heap dump
    help        - Show this help message

Examples:
    $SCRIPT_NAME start
    $SCRIPT_NAME log error 100
    $SCRIPT_NAME log app 200

Environment Variables:
    BASE_PATH     - Application base directory (default: script directory)
    APP_PROFILE   - Spring profile (default: prod)
    JAVA_PATH     - Java executable path (default: java)

Files:
    PID file:     $PID_FILE
    App log:      $LOG_FILE
    Error log:    $ERROR_LOG_FILE
    GC log:       $GC_LOG_FILE

EOF
}

#========================================================================
# 主程序入口
#========================================================================

# 检查参数
if [ $# -lt 1 ]; then
    error "Missing command"
    show_help
    exit 1
fi

# 解析命令
case "$1" in
    start)
        start_app
        exit $?
        ;;
    stop)
        stop_app
        exit $?
        ;;
    restart)
        restart_app
        exit $?
        ;;
    status)
        status_app
        exit $?
        ;;
    log)
        log_app "$2" "$3"
        exit $?
        ;;
    attach)
        attach_screen
        exit $?
        ;;
    jvm)
        jvm_info
        exit $?
        ;;
    heapdump)
        heap_dump
        exit $?
        ;;
    help|--help|-h)
        show_help
        exit 0
        ;;
    *)
        error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
```

使用方式

```bash
# 给脚本执行权限
chmod +x app_manager.sh

# 基本操作
./app_manager.sh start
./app_manager.sh status  
./app_manager.sh stop
./app_manager.sh restart

# 日志查看
./app_manager.sh log app 100    # 查看应用日志最后100行
./app_manager.sh log error 50   # 查看错误日志最后50行

# JVM诊断
./app_manager.sh jvm          # 查看JVM信息
./app_manager.sh heapdump     # 生成堆转储

# 实时监控
./app_manager.sh attach       # 连接到screen会话
```